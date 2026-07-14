---
title: "kegg-cli"
summary: "A command-line pathfinder over the KEGG biochemical database — depth-first search for the shortest reaction path between two compounds."
stack: [Python]
order: 13
repo: https://github.com/Shaumik-Ashraf/kegg-cli
---

A cross-platform CLI for querying the Kyoto Encyclopedia of Genes and
Genomes (KEGG) database: find, list, and get information on any compound,
enzyme, or reaction, and — the part I worked on — discover a reaction
pathway between two compounds that aren't directly connected.

## The pathfinding

Two depth-first search variants solve for a route between a starting and
target compound: one searches over KEGG's own curated modules (pre-built
pathways), the other searches directly over individual reactions when no
curated module connects the two compounds. Same classical
graph-search idea used for shortest-path problems generally, applied here
to a biochemical reaction network instead of a road network or a state
graph.

Built at Cornell as a bioengineering course project (BEE 3600) with
Shaumik Ashraf, under Prof. Buzz Barstow — the repo lives under my
collaborator's account since it was a joint project.
