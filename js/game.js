

var game = new Phaser.Game("100%", "100%" , Phaser.AUTO, "game", {
    preload: preload,
    create: create,
    update: update
});


var WORLD_HEIGHT = 1200;
var WORLD_WIDTH = 1920;
var MAX_LAYERS = 6;

Transform = function (body) {
    this.forward = new Phaser.Point(Math.cos(game.math.degToRad(body.angle - 90)),Math.sin(game.math.degToRad(body.angle - 90)));
    this.right = new Phaser.Point(Math.cos(game.math.degToRad(body.angle)),Math.sin(game.math.degToRad(body.angle)));
    this.left = Phaser.Point.negative(this.right);
    this.back = Phaser.Point.negative(this.forward);
}
Transform.constructor = Transform;
////////////
Rudder = function(x,y){
    Phaser.Sprite.call(this,game,x,y);

    game.physics.p2.enable(this,true);
    this.body.setRectangle(10,30);
    this.body.angularDamping = 0.5;
    this.body.mass = 0.1;

    game.add.existing(this);
}
Rudder.prototype = Object.create(Phaser.Sprite.prototype);
Rudder.constructor = Rudder;
Rudder.prototype.getTransform = function () {
    return new Transform(this.body);
}
Rudder.prototype.addForce = function (force) {
    this.body.force.x = force.x;
    this.body.force.y = force.y;
}
Rudder.prototype.update = function () {
    this.killOrthogonalVelocity();
}
Rudder.prototype.killOrthogonalVelocity = function () {
    var vel = new Phaser.Point(this.body.velocity.x,this.body.velocity.y);
    var forwardVelocity = Phaser.Point.projectUnit(vel,this.getTransform().forward);
    var orthogonalVel = Phaser.Point.project(vel,this.getTransform().right);
    var drift = 0.5;

    var resultVel = Phaser.Point.add(forwardVelocity,orthogonalVel.multiply(drift,drift));
    this.body.velocity.x = resultVel.x;
    this.body.velocity.y = resultVel.y;
}
////////////////////
Ship = function(x,y){
    Phaser.Sprite.call(this,game,x,y);

    game.physics.p2.enable(this,true);
    this.body.setRectangle(60,140);
    this.body.damping = 0.5;
    this.body.angularDamping = 0.5;

    game.add.existing(this);
}
Ship.prototype = Object.create(Phaser.Sprite.prototype);
Ship.constructor = Ship;
Ship.prototype.getTransform = function () {
    return new Transform(this.body);
}
Ship.prototype.update = function () {
    this.killOrthogonalVelocity(0.95);
}
Ship.prototype.killOrthogonalVelocity = function (drift) {
    var vel = new Phaser.Point(this.body.velocity.x,this.body.velocity.y);
    var forwardVelocity = Phaser.Point.projectUnit(vel,this.getTransform().forward);
    var orthogonalVel = Phaser.Point.project(vel,this.getTransform().right);

    var resultVel = Phaser.Point.add(forwardVelocity,orthogonalVel.multiply(drift,drift));
    this.body.velocity.x = resultVel.x;
    this.body.velocity.y = resultVel.y;
    
}
Ship.prototype.fire = function () {
    var startPos = this.getTransform().right;
    var ball = new CannonBall(this.x+startPos.x*30,this.y+startPos.y*30);
    ball.body.velocity.x = startPos.x * 500;
    ball.body.velocity.y = startPos.y * 500;
}

CannonBall = function (x,y) {
    Phaser.Sprite.call(this,game,x,y);

    game.physics.p2.enable(this,true);
    this.body.setCircle(3);
    this.body.mass = 0.1;
    game.add.existing(this);
}
CannonBall.prototype = Object.create(Phaser.Sprite.prototype);
CannonBall.constructor = CannonBall;


var instructions;
var ship;
var rudder;

var cursors;
var graphics;

var wind;

function preload() {
    game.load.image('background', 'assets/background.png');
}
function create() {
    game.canvas.oncontextmenu = function (e) { e.preventDefault(); }
    game.add.sprite(0, 0, 'background');
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);


    game.physics.p2.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ship = new Ship(400,400);
    rudder = new Rudder(400,500);
    game.physics.p2.createRevoluteConstraint(ship,[0,80],rudder,[0,-rudder.height/2])

    wind = (new Phaser.Point(game.rnd.realInRange(-1,1),game.rnd.realInRange(-1,1))).normalize();

    for(var i = 0;i<10;i++)
    {
        new CannonBall(i*50,300);
    }

    game.camera.follow(ship);

    graphics = game.add.graphics(0,0);


    cursors = game.input.keyboard.createCursorKeys();

    game.input.onDown.add(click, this);
    instructions = game.add.text(100, 10, "Кораблики v.0.0.2\n пип пип пип\nстрелочки - управление\nкакая-то кнопка(не помню какая) - стрельба", {
        font: "14px Colibri",
        fill: "#ffffff",
        align: "center"
    });
    instructions.fixedToCamera = true;
}

function click(event) {
    ship.fire();
}



function update() {

    var vel = new Phaser.Point(ship.body.velocity.x,ship.body.velocity.y);
    var coeff = game.math.mapLinear(vel.getMagnitude(),0,200,0,1);
    graphics.clear()
    graphics.lineStyle(1,0xffff00,1)
    graphics.moveTo(ship.x,ship.y);
    var target = ship.getTransform().right.rotate(0,0,30*coeff+5,true);
    graphics.lineTo(ship.x + target.x*100,ship.y + target.y*100);
    graphics.moveTo(ship.x,ship.y);
    target = ship.getTransform().right.rotate(0,0,-30*coeff-5,true);
    graphics.lineTo(ship.x + target.x*100,ship.y + target.y*100);
    graphics.arc(ship.x,ship.y,300,game.math.degToRad(ship.body.angle-30*coeff-5),game.math.degToRad(ship.body.angle+30*coeff+5));



    if(cursors.up.isDown)
    {
        ship.body.thrust(200);
    }
    if(cursors.right.isDown)
    {
        rudder.body.rotateLeft(50);
    }
    if(cursors.left.isDown)
    {
        rudder.body.rotateRight(50);
    }

}