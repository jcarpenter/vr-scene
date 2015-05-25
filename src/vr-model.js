/* globals define */
(function(define){'use strict';define(function(require,exports,module){

/**
 * Dependencies
 */

var component = require('gaia-component');

/**
 * Simple logger
 * @type {Function}
 */
var debug = 0 ? console.log.bind(console) : function() {};

/**
 * Exports
 */

module.exports = component.register('vr-model', {
  extends: HTMLDivElement.prototype,

  created: function() {
    this.position = {
      x: 0,
      y: 0,
      z: 0
    };
    this.orientation = new VR.Euler(0, 0, 0);
    this.setupShadowRoot();
    this.initCanvas();
    this.findScene();
    this.updateTransform();
  },

  initCanvas: function () {
    var canvas = this.canvas = this.shadowRoot.querySelector('canvas');
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    canvas.style.height='100%';
    // ...then set the internal size to match
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    //var ctx = this.context = canvas.getContext('2d');
    //ctx.fillStyle = "red";
    //ctx.fillRect(10, 10, 100, 100);
    this.initRenderer();
  },

  initRenderer: function() {
    var camera = this.camera = new THREE.PerspectiveCamera( 70, this.canvas.width / this.canvas.height, 1, 10000 );
    camera.position.z = 500;
    var scene = this.scene = new THREE.Scene();
    var renderer = this.renderer = new THREE.WebGLRenderer( { canvas: this.canvas, antialias: true, alpha: true } );
    createLights();
    renderer.setSize( this.canvas.width, this.canvas.height );
    renderer.sortObjects = false;
    this.setupScene();
    renderer.render(scene, camera);
    function createLights() {
      var directionalLight = new THREE.DirectionalLight(0xffffff);
      directionalLight.position.set(1, 1, 1).normalize();
      scene.add(directionalLight);
    }
  },

  setupScene: function() {
    var material = new THREE.MeshLambertMaterial({ color: 'magenta' });
    var model = this.model = new THREE.Mesh(new THREE.BoxGeometry(350, 350, 350), material);
    model.overdraw = true;
    model.position.set(0, 0, 0);
    this.scene.add(model);
    this.animate();
  },

  animate: function() {
    var self = this;
    var lastTime = self.lastTime || 0;
    var angularSpeed = self.angularSpeed || 0.2;
    requestAnimationFrame(function() {
      self.animate();
    });

    var time = (new Date()).getTime();
    var timeDiff = time - lastTime;
    var angleChange = angularSpeed * timeDiff * 2 * Math.PI / 1000;
    self.model.rotation.y += angleChange;
    self.lastTime = time;

    self.renderer.render(self.scene, self.camera);
  },

  attributeChanged: function(name, from, to) {
    this.updateTransform();
  },

  epsilon: function ( value ) {
    return Math.abs( value ) < 0.000001 ? 0 : value;
  },

  getCameraCSSMatrix: function (matrix) {
    var epsilon = this.epsilon;
    var elements = matrix.elements;

    return 'matrix3d(' +
      epsilon( elements[ 0 ] ) + ',' +
      epsilon( elements[ 1 ] ) + ',' +
      epsilon( elements[ 2 ] ) + ',' +
      epsilon( elements[ 3 ] ) + ',' +
      epsilon( elements[ 4 ] ) + ',' +
      epsilon( elements[ 5 ] ) + ',' +
      epsilon( elements[ 6 ] ) + ',' +
      epsilon( elements[ 7 ] ) + ',' +
      epsilon( elements[ 8 ] ) + ',' +
      epsilon( elements[ 9 ] ) + ',' +
      epsilon( elements[ 10 ] ) + ',' +
      epsilon( elements[ 11 ] ) + ',' +
      epsilon( elements[ 12 ] ) + ',' +
      epsilon( elements[ 13 ] ) + ',' +
      epsilon( elements[ 14 ] ) + ',' +
      epsilon( elements[ 15 ] ) +
    ')';
  },

  updateTransform: function() {
    var orientationX = this.orientation.x = this.getAttribute('lat') || 0;
    var orientationY = this.orientation.y = this.getAttribute('long') || 0;
    var x = this.position.x = this.getAttribute('x') || 0;
    var y = this.position.y = this.getAttribute('y') || 0;
    var z = this.position.z = this.getAttribute('z') || 0;

    var translation = new VR.Matrix4().makeTranslation(x, y, this.perspective - z);
    var rotationY = new VR.Matrix4().makeRotationY(VR.Math.degToRad(orientationY));
    var rotationX = new VR.Matrix4().makeRotationX(VR.Math.degToRad(orientationX));
    var matrix = new VR.Matrix4();
    this.style.transform = 'translate3d(-50%, -50%, 0) ' + this.getCameraCSSMatrix(translation.multiply(rotationY.multiply(rotationX)));
  },

  findScene: function() {
    var scenes = document.querySelectorAll('vr-scene');
    var perspective;
    for (var i=0; i < scenes.length; ++i) {
      if (scenes[i] === this.parentNode) {
        this.scene = scenes[i];
        perspective = window.getComputedStyle(this.scene, null).perspective;
        this.perspective = parseInt(perspective.substring(0, perspective.indexOf("px"))) - 1;
        this.updateTransform();
        return;
      }
    }

    this.perspective = 0;
    this.updateTransform();

    function isDescendant(parent, child) {
     var node = child.parentNode;
     while (node != null) {
         if (node == parent) {
             return true;
         }
         node = node.parentNode;
     }
     return false;
    }
  },

  template: `
    <canvas width="100%"></canvas>
    :host {
      left: 50%;
      top: 50%;
    }

    :host canvas {
      margin: 0;
      padding: 0;
    }
  `
});

});})(typeof define=='function'&&define.amd?define
:(function(n,w){'use strict';return typeof module=='object'?function(c){
c(require,exports,module);}:function(c){var m={exports:{}};c(function(n){
return w[n];},m.exports,m);w[n]=m.exports;};})('vr-model',this));
