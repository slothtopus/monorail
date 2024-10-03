# Monorail

All I wanted to do was drag something along a curve...

...but dragging a point along a path is trickier than it seems. Mouse movements, which are unconstrained by nature, need to be projected onto to the constraints of the path in a way that feels natural.

I fell down the rabbit hole of this problem and the experiments here are my attempts at a general solution, plus a few interesting applications.

The experiments are written in Vue just to make life easier for myself, but most of the interesting code is [/src/lib](/src/lib). Run things locally with with `npm run serve` or [checkout the online demo here](https://github-demos.s3.eu-west-2.amazonaws.com/monorail/index.html#/bezier).
