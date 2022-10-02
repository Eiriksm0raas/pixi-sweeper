# pixi-sweeper
The goal of this site was to make a 'clone' of [minesweeperonline.com](http://www.minesweeperonline.com) to learn using pixi.js  
I am not so familiar with the library so a lot of the initializaion of the game is setup awkwardly inside  
the texture loader.  

Altough it's not very optimized it was a good learning experience for pixi.js  
## Problems:
- The 'Algorithm' for placing mines will be very slow when the bombs/ squares ratio is high.
- No failsafe for too many bombs
- The opening Algorithm uses recursion for chaining opening of empty spaces.  
this is a fun solution, but for very big empty boards it could lead to hiting max recursion depth, memory leaks etc.
- Keeps track of time after reaching max time (999). Dosen't matter but might as well stop
- Gamestate is not really kept track of well enough, restart button is therefor quite lazily just a refresh button