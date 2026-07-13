(function () {
  "use strict";

  var input = document.getElementById("site-search-input");
  var listbox = document.getElementById("site-search-listbox");
  var note = document.getElementById("site-search-note");
  var status = document.getElementById("site-search-status");
  if (!input || !listbox) return;

  var indexUrl = input.getAttribute("data-index-url");
  var items = [];
  var results = [];
  var activeIndex = -1;

  function norm(s) {
    return (s || "").toString().toLowerCase();
  }

  // Hand-rolled scorer: title hits weigh heaviest, then tags, then the
  // short summary, then the full body — no stemming, just substring
  // matching against each indexed field, which is plenty for a ~6-page
  // site and keeps this dependency-free.
  function scoreItem(item, terms) {
    var title = norm(item.title);
    var tags = norm((item.tags || []).join(" "));
    var summary = norm(item.summary);
    var body = norm(item.body);
    var score = 0;
    terms.forEach(function (term) {
      if (!term) return;
      if (title === term) score += 20;
      else if (title.indexOf(term) !== -1) score += 10;
      if (tags.indexOf(term) !== -1) score += 6;
      if (summary.indexOf(term) !== -1) score += 3;
      if (body.indexOf(term) !== -1) score += 1;
    });
    return score;
  }

  function search(query) {
    var terms = norm(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return items
      .map(function (item) {
        return { item: item, score: scoreItem(item, terms) };
      })
      .filter(function (r) {
        return r.score > 0;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, 8)
      .map(function (r) {
        return r.item;
      });
  }

  function closeListbox() {
    listbox.hidden = true;
    listbox.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
    results = [];
  }

  function setActive(index) {
    var options = listbox.querySelectorAll(".site-search__option");
    for (var i = 0; i < options.length; i++) {
      options[i].setAttribute("aria-selected", "false");
    }
    if (index >= 0 && options[index]) {
      options[index].setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", options[index].id);
      options[index].scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
    activeIndex = index;
  }

  function navigate(item) {
    window.location.href = item.url;
  }

  function renderResults(query) {
    listbox.innerHTML = "";

    if (!results.length) {
      var empty = document.createElement("li");
      empty.className = "site-search__empty";
      empty.setAttribute("role", "presentation");
      empty.textContent = 'No results for "' + query + '"';
      listbox.appendChild(empty);
      listbox.hidden = false;
      input.setAttribute("aria-expanded", "true");
      status.textContent = "No results for " + query;
      return;
    }

    results.forEach(function (item, i) {
      var li = document.createElement("li");
      li.className = "site-search__option";
      li.id = "site-search-option-" + i;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");

      var titleEl = document.createElement("span");
      titleEl.className = "site-search__option-title";
      titleEl.textContent = item.title;

      var metaEl = document.createElement("span");
      metaEl.className = "site-search__option-meta";
      metaEl.textContent = item.section + (item.summary ? " — " + item.summary : "");

      li.appendChild(titleEl);
      li.appendChild(metaEl);

      // mousedown (not click) fires before the input's blur handler, so
      // navigation still runs before closeListbox() empties the list.
      li.addEventListener("mousedown", function (e) {
        e.preventDefault();
        navigate(item);
      });

      listbox.appendChild(li);
    });

    listbox.hidden = false;
    input.setAttribute("aria-expanded", "true");
    status.textContent = results.length + " result" + (results.length === 1 ? "" : "s") + " for " + query;
  }

  function handleInput() {
    var query = input.value.trim();
    if (!query) {
      closeListbox();
      status.textContent = "";
      return;
    }
    results = search(query);
    activeIndex = -1;
    renderResults(query);
  }

  function handleKeydown(e) {
    if (e.key === "Escape") {
      closeListbox();
      return;
    }
    if (!results.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive(activeIndex + 1 >= results.length ? 0 : activeIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive(activeIndex - 1 < 0 ? results.length - 1 : activeIndex - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          navigate(results[activeIndex]);
        } else {
          navigate(results[0]);
        }
        break;
      default:
        break;
    }
  }

  fetch(indexUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      items = data;
      input.disabled = false;
      note.hidden = true;
      input.addEventListener("input", handleInput);
      input.addEventListener("keydown", handleKeydown);
      input.addEventListener("blur", function () {
        // Delay so a mousedown on an option (above) registers first.
        window.setTimeout(closeListbox, 150);
      });
    })
    .catch(function () {
      note.textContent = "Search is unavailable right now.";
    });
})();
