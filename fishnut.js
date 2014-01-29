window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = [];
    this.downloadQueue = [];
}

AssetManager.prototype.queueDownload = function (path) {
    console.log(path.toString());
    this.downloadQueue.push(path);
}

AssetManager.prototype.isDone = function () {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
}
AssetManager.prototype.downloadAll = function (callback) {
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function () {
            console.log("dun: " + this.src.toString());
            that.successCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.addEventListener("error", function () {
            that.errorCount += 1;
            if (that.isDone()) { callback(); }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getAsset = function(path){
    //console.log(path.toString());
    return this.cache[path];
}


function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.wheel = null;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
}

GameEngine.prototype.init = function (ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();

    console.log('game initialized');
}

GameEngine.prototype.start = function () {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function () {
    console.log('Starting input');

    var getXandY = function (e) {
        var x = e.clientX - that.ctx.canvas.getBoundingClientRect().left;
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top;

        if (x < 1024) {
            x = Math.floor(x / 32);
            y = Math.floor(y / 32);
        }

        return { x: x, y: y };
    }

    var that = this;

    this.ctx.canvas.addEventListener("click", function (e) {
        that.click = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousemove", function (e) {
        that.mouse = getXandY(e);
    }, false);

    this.ctx.canvas.addEventListener("mousewheel", function (e) {
        that.wheel = e;
    }, false);

    console.log('Input started');
}

GameEngine.prototype.addEntity = function (entity) {
    console.log('added entity');
    this.entities.push(entity);
}

GameEngine.prototype.draw = function (drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function () {
    var entitiesCount = this.entities.length;

    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];

        if (!entity.removeFromWorld) {
            entity.update();
        }
    }

    for (var i = this.entities.length - 1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function () {
    this.update();
    this.draw();
    this.click = null;
    this.wheel = null;
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function () {
}

Entity.prototype.draw = function (ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.stroke();
        ctx.closePath();
    }
}

Entity.prototype.rotateAndCache = function (image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size / 2, size / 2);
    offscreenCtx.rotate(angle);
    offscreenCtx.translate(0, 0);
    offscreenCtx.drawImage(image, -(image.width / 2), -(image.height / 2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}

// Fisher and Nutters code here
// Fisher and Nutters Animation code below

function Renderer(pop) {
    this.population = pop;

    Entity.call(this, null, 0, 0);
}

Renderer.prototype = new Entity();
Renderer.prototype.constructor = Renderer;

Renderer.prototype.update = function () {
    this.population.day();
    
    Entity.prototype.update.call(this);
}

Renderer.prototype.drawGeneplex = function (ctx, gp, x, y) {
    var offset = 0;
    //console.log(gp);
    for (var j = 0; j < gp.genes.length; j++) {
        ctx.beginPath();
        ctx.strokeStyle = gp.genes[j].reward() === 3 ? "yellow" : gp.genes[j].reward() === 2 ? "lightblue" : "grey";
        ctx.rect(x + offset, y, 14 * gp.genes[j].cost(), 4);
        //console.log("Gene " + j + " Cost " + gp.genes[j].cost() + " Game " + gp.genes[j].minigame.perm.perm + " Attempt " + gp.genes[j].perm.perm);
        ctx.stroke();
        offset += 14 * gp.genes[j].cost();
    }

}

Renderer.prototype.drawGenome = function (ctx, genome, x, y) {

    ctx.beginPath();
    ctx.strokeStyle = "pink";
    ctx.rect(x, y, 1, 1 * genome.lengthmax);
    ctx.stroke();

    for (var i = 0; i < genome.geneplexes.length; i++) {
        var gp = genome.geneplexes[i];
        var offset = 0;

        ctx.beginPath();
        ctx.strokeStyle = "lightblue";
        ctx.rect(x + 14 + i * 13, y, 1, 1 * gp.fitness());
        ctx.stroke();

        for (var j = 0; j < gp.genes.length; j++) {
            ctx.beginPath();
            ctx.strokeStyle = gp.genes[j].reward() === 3 ? "yellow" : gp.genes[j].reward() === 2 ? "lightblue" : "grey";
            ctx.rect(x + 10 + i * 13, y + offset, 2, 1 * gp.genes[j].cost());
            //console.log("Gene " + j + " Cost " + gp.genes[j].cost() + " Game " + gp.genes[j].minigame.perm.perm + " Attempt " + gp.genes[j].perm.perm);
            ctx.stroke();
            offset += 1 * gp.genes[j].cost();
        }
    }
    genome.minmax(1);
    this.drawGeneplex(ctx,genome.mins[0], x, y + 53)
    this.drawGeneplex(ctx,genome.maxs[0], x, y + 60);
}

Renderer.prototype.drawAgent = function (ctx, agent, x, y) {
    this.drawGenome(ctx, agent.genome, x, y);
    this.drawGenome(ctx, agent.memome, x, y + 70);
}

Renderer.prototype.draw = function (ctx) {
    var that = this;
    // draw genome
    ctx.font = "18px Arial";
    ctx.fillStyle = "pink";
    ctx.fillText("Day " + this.population.days, 710, 150);
    ctx.fillText("Min " + this.population.agents[0].memome.mins[0].fitness(), 710, 170);
    ctx.fillText("Max " + this.population.agents[0].memome.maxs[0].fitness(), 710, 190);

    for (var i = 0; i < this.population.numagent; i++) {
        this.drawAgent(ctx, this.population.agents[i], 10, 10 + 140 * i);
    }
}

// Fisher and Nutters simulation code below

var contains = function (lst, obj) {
    for (var i =0; lst != null && i < lst.length; i++){
        if(lst[i] === obj)
            return true;
    }
    return false;
}

var swap = function (list, i, j) {
    var temp = list[i];
    list[i] = list[j];
    list[j] = temp;
}


var Perm = function (size) {
    this.perm = [];
    this.size = size;
    var list = [];

    for (var i = 0; i < size; i++) {
        list.push(i);
    }
    
    for (var i = 0; i < size; i++) {
        var index = Math.floor(Math.random() * list.length);

        this.perm.push(list[index]);
        list.splice(index, 1);
    }
}

Perm.prototype.compare = function (other) {
    var count = 0;
    var score = 0;

    while (count < this.perm.length) {
        if(contains(this.perm, other.perm[score]))
            count++;
        score++;
     }
    return score;
}

Perm.prototype.mutate = function () {
    var i = Math.floor(Math.random() * this.size);
    var j = i;
    while (j === i) {
        j = Math.floor(Math.random() * this.size);
    }

    swap(this.perm, i, j);
}

Perm.prototype.clone = function () {
    var np = new Perm(this.perm.length);
    for (var i = 0; i < this.perm.length; i++) {
        np.perm[i] = this.perm[i];
    }
    return np;
}

var Minigame = function (size, reward, type) {
    this.perm = new Perm(size);
    this.perm.perm = this.perm.perm.splice(0, reward);
    this.reward = reward;
    this.type = type;
}

Minigame.prototype.play = function (perm) {
    return this.perm.compare(perm);
}

Minigame.prototype.mutate = function () {
    var i = Math.floor(Math.random()*this.reward);
    var j = Math.floor(Math.random()*this.reward);

    swap(this.perm.perm, i, j);
}

Minigame.prototype.clone = function () {
    var nm = new Minigame(this.size, this.reward, this.type);
    nm.perm = this.perm.clone();
    return nm;
}


var Gene = function (minigame, perm) {
    this.minigame = minigame;
    this.perm = perm;
}

Gene.prototype.cost = function () {
    return this.minigame.play(this.perm);
}

Gene.prototype.reward = function () {
    return this.minigame.reward;
}

Gene.prototype.mutate = function () {
    this.perm.mutate();
}

Gene.prototype.clone = function () {
    return new Gene(this.minigame.clone(), this.perm.clone());
}

var Geneplex = function (lengthmax, size, rewardmax) {
    this.genes = [];
    this.size = size;
    this.rewardmax = rewardmax;
    this.lengthmax = lengthmax;
    var reward = Math.floor(Math.random()*rewardmax + 1)
    this.genes.push(new Gene(new Minigame(size, reward, reward == 1 ? "FISH" : "NUTS"), new Perm(size)));
}

Geneplex.prototype.mutate = function (){
    if(Math.random()>0.5){
        // mutate a random gene in the list
        var index = Math.floor(Math.random()*this.genes.length);
        this.genes[index].mutate();
        if(this.length() > this.lengthmax){
            this.genes.splice(index,1);
        }
    }
    else {
        // grow a new gene
        var reward = Math.floor(Math.random()*this.rewardmax + 1)
        this.genes.push(new Gene(new Minigame(this.size, reward, reward == 1 ? "FISH" : "NUTS"), new Perm(this.size)));
        while(this.length() > this.lengthmax){
            this.genes.pop();
        }
    }
}

Geneplex.prototype.clone = function () {
    var gp = new Geneplex(this.lengthmax, this.size, this.rewardmax);
    gp.genes = [];
    for (var i = 0; i < this.genes.length; i++) {
        gp.genes.push(this.genes[i].clone());
    }
    return gp;
}

Geneplex.prototype.length = function () {
    var length = 0;
    for (var i = 0; i < this.genes.length; i++) {
        length += this.genes[i].cost();
    }
    return length;
}

Geneplex.prototype.fitness = function () {
    var fitness = 0;
    for (var i = 0; i < this.genes.length; i++) {
        fitness += this.genes[i].reward();
    }
    return fitness;

}

var Genome = function (genomesize, lengthmax, size, rewardmax) {
    this.geneplexes = [];
    this.genomesize = genomesize;
    this.lengthmax = lengthmax;
    this.size = size;
    this.rewardmax = rewardmax;
    this.generation = 0;

    this.mins = [];
    this.maxs = [];

    for(var i = 0; i < genomesize; i++){
        this.geneplexes.push(new Geneplex(lengthmax, size, rewardmax));
    }
    this.minmax(1);
}

Genome.prototype.minmax = function (num) {
    this.mins = [];
    this.maxs = [];

    while (num > 0) {
        var index = 0;
        var maxdex = 0;
        var min = this.lengthmax;
        var max = 0

        for (var i = 0; i < this.geneplexes.length; i++) {
            if (contains(this.mins, this.geneplexes[i])) continue;
            if (this.geneplexes[i].fitness() < min) {
                min = this.geneplexes[i].fitness();
                index = i;
            }
        }
        for (var i = 0; i < this.geneplexes.length; i++) {
            if (contains(this.maxs, this.geneplexes[i])) continue;
            if (this.geneplexes[i].fitness() >= max) {
                max = this.geneplexes[i].fitness();
                maxdex = i;
            }
        }

        this.geneplexes[index].index = index;
        this.mins.push(this.geneplexes[index]);
        this.maxs.push(this.geneplexes[maxdex]);
        num--;
    }
}

Genome.prototype.mutate = function(rate) {
    var firstrun = true;
    this.generation++;
    this.minmax(rate);
    while (rate > 0) {
        rate--;
        var index = Math.floor(Math.random() * this.genomesize);
        var gp = this.geneplexes[index].clone();
        gp.mutate();
        //console.log("Mutating index " + index);

        this.geneplexes[this.mins[rate].index] = gp;
        //console.log("Replacing index " + index + " Min " + min);
    }
}

Genome.prototype.clone = function() {
    var g = new Genome(this.genomesize, this.lengthmax, this.size, this.rewardmax);

    g.geneplexes = [];

    for (var i = 0; i < this.geneplexes.length; i++) {
        g.geneplexes.push(this.geneplexes[i].clone());
    }
    g.minmax(1);
    return g;
}

function Agent(mutationrate, genomesize, lengthmax, size, rewardmax) {
    this.genomesize = genomesize;
    this.lengthmax = lengthmax;
    this.size = size;
    this.rewardmax = rewardmax;
    this.mutationrate = mutationrate;

    this.fitness = 0;
    this.age = 0;

    this.genome = new Genome(genomesize, lengthmax, size, rewardmax);
    this.memome = this.genome.clone();
}

Agent.prototype.day = function () {
    this.age++;

    this.memome.minmax(1);
    this.fitness += this.memome.maxs[0].fitness();
    this.memome.mutate(this.mutationrate);
}

Agent.prototype.mutate = function () {
    this.genome.mutate(this.mutationrate);
    this.memome = this.genome.clone();
}

Agent.prototype.clone = function () {
    var a = new Agent(this.mutationrate, this.genomesize, this.lengthmax, this.size, this.rewardmax);
    a.genome = this.genome.clone();
    a.memome = a.genome.clone();
    return a;
}

function Population(numagent, mutationrate, genomesize, lengthmax, size, rewardmax) {
    this.agents = [];
    this.days = 0;

    this.numagent = numagent;
    this.mutationrate = mutationrate;
    this.genomesize = genomesize;
    this.lengthmax = lengthmax;
    this.size = size;
    this.rewardmax = rewardmax;

    for (var i = 0; i < numagent; i++) {
        var a = new Agent(this.mutationrate, this.genomesize, this.lengthmax, this.size, this.rewardmax);
        this.agents.push(a);
    }
}

Population.prototype.day = function () {
    this.days++;
    for (var i = 0; i < this.numagent; i++) {
        this.agents[i].day();
    }
    if (this.days % 10 === 0) {
        this.forum();
    }
    if (this.days % 30 === 0) {
        this.mutate();
    }
}

Population.prototype.forum = function () {
    var g = new Genome(this.genomesize, this.lengthmax, this.size, this.rewardmax);
    g.geneplexes = [];
    for (var i = 0; i < this.agents.length; i++) {
        //console.log(this.agents[i].memome.maxs);
        this.agents[i].memome.minmax(this.mutationrate);
        for (var j = 0; j < this.mutationrate; j++) {
            var m = this.agents[i].memome.maxs[j].clone();
            //console.log(m);
            g.geneplexes.push(m);
        }
    }
    g.minmax(this.mutationrate);
    for (var i = 0; i < this.agents.length; i++) {
        for (var j = 0; j < this.mutationrate; j++) {
            this.agents[i].memome.geneplexes[this.agents[i].memome.mins[j].index] = g.maxs[j].clone();
        }
    }
}

Population.prototype.mutate = function () {
    this.agents[(this.days/30) % this.agents.length].mutate();
}

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/FishSite.png");
ASSET_MANAGER.queueDownload("./img/NutSite.png");
ASSET_MANAGER.queueDownload("./img/Hut.png");
ASSET_MANAGER.queueDownload("./img/FishNutter.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var p = new Population(4, 5, 50, 50, 5, 3);

    var gameEngine = new GameEngine();
    var renderer = new Renderer(p);

    gameEngine.addEntity(renderer);
 
    //for (var i = 0; i < g.geneplexes.length; i++) {
    //    gp = g.geneplexes[i];
    //    for (var j = 0; j < gp.genes.length; j++) {
    //        console.log("Gene " + j);
    //        console.log(gp.genes[j].perm.perm);
    //        console.log(gp.genes[j].minigame.perm.perm);
    //        console.log(gp.genes[j].cost());
    //        console.log(gp.genes[j].reward());
    //    }
    //}

    gameEngine.init(ctx);
    gameEngine.start();
});
