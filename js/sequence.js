[].slice.call(document.querySelectorAll('a[rel=external]'), 0).forEach(function(a) {
    a.addEventListener('click', function(e) {
        window.open(this.href, '_blank');
        e.preventDefault();
    }, false);
});

var rendererStats = new THREEx.RendererStats();

rendererStats.domElement.style.position = 'absolute'
rendererStats.domElement.style.left = '0px'
rendererStats.domElement.style.bottom = '0px'
//document.body.appendChild( rendererStats.domElement )

var loading = document.getElementById('loading');
var container, renderer, scene, camera, mesh, fov = 90,
    material, sphereMaterial;
var start = Date.now();
var distance = 3500,
    ndistance = 300;

window.addEventListener('load', init);

var texture = 0;

document.getElementById('switchMaterial').addEventListener('click', function(e) {
    switchTexture();
    e.preventDefault();
});

function switchTexture() {

    texture++;
    texture %= 3;

    switch (texture) {
        case 1:
            material.uniforms.normalScale.value = 1;
            material.uniforms.texScale.value = 5;
            material.uniforms.useSSS.value = 1;
            material.uniforms.useScreen.value = 0;


            break;
            break;
    }


}

function init() {

    clock = new THREE.Clock();

    container = document.getElementById('container');

    scene = new THREE.Scene();
    scene.position = new THREE.Vector3(0, 0, 0);

    camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, .01, 100000);
    camera.position.z = 100;
    camera.target = new THREE.Vector3(0, 0, 0);

    scene.add(camera);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.autoClear = false;
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.physicallyBasedShading = true;

    container.appendChild(renderer.domElement);

    container.addEventListener('mousewheel', onMouseWheel, false);
    container.addEventListener('DOMMouseScroll', onMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);

    window.addEventListener('mousedown', onTouchStart);
    window.addEventListener('touchstart', onTouchStart);

    function onTouchStart(event) {

        var x, y;

        if (event.changedTouches) {
            x = event.changedTouches[0].pageX;
            y = event.changedTouches[0].pageY;
        } else {
            x = event.clientX;
            y = event.clientY;
        }

        isUserInteracting = true;

        onPointerDownPointerX = x;
        onPointerDownPointerY = y;

        onPointerDownLon = lon;
        onPointerDownLat = lat;

        // event.preventDefault();
    }

    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('touchmove', onTouchMove);

    function onTouchMove(event) {

        if (event.changedTouches) {
            x = event.changedTouches[0].pageX;
            y = event.changedTouches[0].pageY;
        } else {
            x = event.clientX;
            y = event.clientY;
        }


        if (isUserInteracting) {

            nlon = (x - onPointerDownPointerX) * 0.1 + onPointerDownLon;
            nlat = (y - onPointerDownPointerY) * 0.1 + onPointerDownLat;

        }

        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;

        event.preventDefault();

    }

    window.addEventListener('mouseup', onTouchEnd);
    window.addEventListener('touchend', onTouchEnd);

    function onTouchEnd(event) {

        isUserInteracting = false;
        event.preventDefault();

    }

    material = new THREE.ShaderMaterial({

        uniforms: {
            textureMap: { 
                type: 't',
                value: null
            },
            normalMap: { 
                type: 't',
                value: null
            },
            normalScale: { 
                type: 'f',
                value: 1
            },
            texScale: { 
                type: 'f',
                value: 5
            },
            useSSS: { 
                type: 'f',
                value: 1
            },
            noise: { 
                type: 'f',
                value: .5
            },
            useScreen: { 
                type: 'f',
                value: 0
            },
            color: { 
                type: 'c',
                // Blob Color. Lightest color is 0x1a1a1a, darkest is 0x111111
                value: new THREE.Color(0x1a1a1a)
            },
            glowColor: {
              type: "c",
              value: new THREE.Color(0xffff00)
            }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        side: THREE.DoubleSide

    });

    resolution = 45;
    numBlobs = 40;

    effect = new THREE.MarchingCubes(resolution, material, true, false);
    effect.scale.set(100, 100, 100);

    scene.add(effect);

    updateCubes(effect, 0, numBlobs);

    sphereMaterial = new THREE.ShaderMaterial({

        uniforms: {
            resolution: { 
                type: 'v2',
                value: new THREE.Vector2(0, 0)
            },
            noise: { 
                type: 'f',
                value: .1
            },
            color: { 
                type: 'c',
                // Background Color. Lightest color is 0x0a0a0a, darkest is 0x#111111
                value: new THREE.Color(0x0a0a0a)
            },
        },
        vertexShader: document.getElementById('sphere-vs').textContent,
        fragmentShader: document.getElementById('sphere-fs').textContent,
        side: THREE.BackSide,

    });

    var sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(1000, 1), sphereMaterial);
    scene.add(sphere);

    // create the particle variables
    var particleCount = 4500,
        particles = new THREE.Geometry(),
        pMaterial = new THREE.ParticleBasicMaterial({
            color: 0x111111,
            size: 1.5
        });

    // now create the individual particles
    for (var p = 0; p < particleCount; p++) {

        // create a particle with random
        // position values, -250 -> 250
        var pX = Math.random() * 800 - 400,
            pY = Math.random() * 800 - 400,
            pZ = Math.random() * 800 - 400,
            particle = new THREE.Vertex(
                new THREE.Vector3(pX, pY, pZ)
            );

        // add it to the geometry
        particles.vertices.push(particle);
    }

    // create the particle system
    var particleSystem = new THREE.ParticleSystem(
        particles,
        pMaterial);

    // add it to the scene
    scene.add(particleSystem);


    var c = container;

    function goFullscreen(e) {
        c.onwebkitfullscreenchange = function(e) {
            c.onwebkitfullscreenchange = function() {};
        };
        c.onmozfullscreenchange = function(e) {
            c.onmozfullscreenchange = function() {};
        };
        if (c.webkitRequestFullScreen) c.webkitRequestFullScreen();
        if (c.mozRequestFullScreen) c.mozRequestFullScreen();
        e.preventDefault();
    }

    document.getElementById('fullscreenBtn').addEventListener('click', goFullscreen)
    container.addEventListener('dblclick', goFullscreen);

    switchTexture();

    onWindowResize();
}





function makeTextSprite(message, parameters) {
    if (parameters === undefined) parameters = {};

    var fontface = parameters.hasOwnProperty("fontface") ?
        parameters["fontface"] : "Arial";

    var fontsize = parameters.hasOwnProperty("fontsize") ?
        parameters["fontsize"] : 18;

    var borderThickness = parameters.hasOwnProperty("borderThickness") ?
        parameters["borderThickness"] : 0;

    var borderColor = parameters.hasOwnProperty("borderColor") ?
        parameters["borderColor"] : {
            r: 0,
            g: 0,
            b: 0,
            a: 1.0
        };

    var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
        parameters["backgroundColor"] : {
            r: 255,
            g: 255,
            b: 255,
            a: 1.0
        };


    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = "Bold " + fontsize + "px " + fontface;

    // get size data (height depends only on font size)
    var metrics = context.measureText(message);
    var textWidth = metrics.width;

    // background color
    context.fillStyle = "rgba(" + backgroundColor.r + "," + backgroundColor.g + "," +
        backgroundColor.b + "," + backgroundColor.a + ")";
    // border color
    context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + "," +
        borderColor.b + "," + borderColor.a + ")";

    context.lineWidth = borderThickness;

    // 1.4 is extra height factor for text below baseline: g,j,p,q.

    // text color
    context.fillStyle = "rgba(255, 255, 255, 1.0)";

    context.fillText(message, borderThickness, fontsize + borderThickness);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas)
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        useScreenCoordinates: false
    });
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(100, 50, 1.0);
    return sprite;
}






function updateCubes(object, time, numblobs, floor, wallx, wallz) {

    object.reset();

    // fill the field with some metaballs

    var i, ballx, bally, ballz, subtract, strength;

    subtract = 12;
    strength = 1.2 / ((Math.sqrt(numblobs) - 1) / 4 + 1);

    for (i = 0; i < numblobs; i++) {

        ballx = Math.sin(i + 1.26 * time * (1.03 + 0.5 * Math.cos(0.21 * i))) * 0.27 + 0.5;
        bally = Math.cos(i + 1.12 * time * 0.21 * Math.sin((0.72 + 0.83 * i))) * 0.27 + 0.5;
        ballz = Math.cos(i + 1.32 * time * 0.1 * Math.sin((0.92 + 0.53 * i))) * 0.27 + 0.5;

        object.addBall(ballx, bally, ballz, strength, subtract);
    }

    if (floor) object.addPlaneY(10, 12);
    if (wallz) object.addPlaneZ(2, 12);
    if (wallx) object.addPlaneX(2, 12);

};

function onWindowResize() {
    var s = 1;
    renderer.setSize(s * window.innerWidth, s * window.innerHeight);
    camera.projectionMatrix.makePerspective(fov, window.innerWidth / window.innerHeight, camera.near, camera.far);
    sphereMaterial.uniforms.resolution.value.set(s * window.innerWidth, s * window.innerHeight);
}

function onMouseWheel(event) {

    // WebKit

    var d = 100;
    if (event.wheelDeltaY) {

        //fov -= event.wheelDeltaY * 0.01;
        ndistance -= d * event.wheelDeltaY * 0.001;

        // Opera / Explorer 9

    } else if (event.wheelDelta) {

        //fov -= event.wheelDelta * 0.05;
        ndistance -= d * event.wheelDelta * 0.005;

        // Firefox

    } else if (event.detail) {

        //fov += event.detail * 1.0;
        ndistance += d * event.detail * .1;

    }

    //camera.projectionMatrix.makePerspective( fov, window.innerWidth / window.innerHeight, camera.near, camera.far );

}

var onMouseDownMouseX = 0,
    onMouseDownMouseY = 0,
    lon = 0,
    onMouseDownLon = 0,
    nlat = 0,
    lat = 0,
    onMouseDownLat = 0,
    nlon = 0,
    phi = 0,
    theta = 0;
lat = 15, isUserInteracting = false;


function onMouseDown(event) {

    event.preventDefault();

    isUserInteracting = true;

    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

    return;

    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    projector.unprojectVector(vector, camera);

    var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

    var intersects = ray.intersectObjects(scene.children);

    if (intersects.length > 0) {

        console.log(intersects[0]);

    }

}

var mouse = {
    x: 0,
    y: 0
}
var projector;

function onMouseMove(event) {

    if (isUserInteracting) {

        nlon = (event.clientX - onPointerDownPointerX) * 0.1 + onPointerDownLon;
        nlat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;

    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

}

function onMouseUp(event) {

    isUserInteracting = false;

}

function renderTextSprite() {
    // Function used to create text sprites.
    /*
    	var spritey = makeTextSprite( "luz",
    		{ fontsize: 24, borderColor: {r:255, g:255, b:255, a:0}, backgroundColor: {r:255, g:255, b:255, a:0} } );
    		spritey.position.set( 50 + 10, 50 + 10, 50 + 10);
    		scene.add( spritey );
    */

}

var start = Date.now();

function startButton() {

    var elapsedTime = clock.getElapsedTime();

    document.getElementById('start').classList.add('start-clicked');

    setTimeout(function() {
        document.getElementById('start').style.display = 'none';
    }, 2000);

    document.getElementById('flash').classList.remove('flash-start');
    document.getElementById('flash').classList.add('flash-clicked');
    setTimeout(function() {
        document.getElementById('flash').classList.remove('flash-clicked');
        document.getElementById('flash').classList.add('flash-over');
    }, 4000);

    startRender();
}

function backMusic() {
    var backMusic = new Audio("assets/sounds/beethoven.mp3");
    var voices = new Audio("assets/sounds/grandpa.mp3");
    backMusic.play();
    backMusic.volume = 1;

    setTimeout(function() {
        voices.play();
        voices.volume = 1;
    }, 78000);
}

function eEleDisse() {
  setTimeout(function() {
    var elapsedTime = clock.getElapsedTime();

    if ( elapsedTime < 93) {
      var loader = new THREE.JSONLoader();
      var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );

      loader.load('json/e-ele-disse.json', function(geometry) {
          mesh = new THREE.Mesh(geometry, material);
          var scale = 20;
          mesh.scale.x = scale;
          mesh.scale.y = scale;
          mesh.scale.z = scale;
          mesh.position.x = Math.random() * 800 - 400;
          mesh.position.y = Math.random() * 800 - 400;
          mesh.position.z = Math.random() * 800 - 400;
          mesh.rotation.y = 90;
          scene.add(mesh);
      });
    }
  }, 89100);
}

function eleDisse() {
  setTimeout(function() {
    var elapsedTime = clock.getElapsedTime();

    if ( elapsedTime < 96) {
      var loader = new THREE.JSONLoader();
      var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );

      loader.load('json/ele-disse.json', function(geometry) {
          mesh = new THREE.Mesh(geometry, material);
          var scale = 20;
          mesh.scale.x = scale;
          mesh.scale.y = scale;
          mesh.scale.z = scale;
          mesh.position.x = Math.random() * 800 - 400;
          mesh.position.y = Math.random() * 800 - 400;
          mesh.position.z = Math.random() * 800 - 400;
          mesh.rotation.y = 10;
          scene.add(mesh);
      });
    }
  }, 90000);
}

function disseHaja() {
  setTimeout(function() {
    var elapsedTime = clock.getElapsedTime();

    if ( elapsedTime < 107) {
      var loader = new THREE.JSONLoader();
      var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );

      loader.load('json/disse-haja.json', function(geometry) {
          mesh = new THREE.Mesh(geometry, material);
          var scale = 20;
          mesh.scale.x = scale;
          mesh.scale.y = scale;
          mesh.scale.z = scale;
          mesh.position.x = Math.random() * 800 - 400;
          mesh.position.y = Math.random() * 800 - 400;
          mesh.position.z = Math.random() * 800 - 400;
          mesh.rotation.y = 60;
          scene.add(mesh);
      });
    }
  }, 102000);
}

function luz() {
  setTimeout(function() {
    var elapsedTime = clock.getElapsedTime();

    if ( elapsedTime < 110) {
      var loader = new THREE.JSONLoader();
      var material = new THREE.MeshBasicMaterial( { color: 0xffffff } );

      loader.load('json/luz.json', function(geometry) {
          mesh = new THREE.Mesh(geometry, material);
          var scale = 20;
          mesh.scale.x = scale;
          mesh.scale.y = scale;
          mesh.scale.z = scale;
          mesh.position.x = Math.random() * 800 - 400;
          mesh.position.y = Math.random() * 800 - 400;
          mesh.position.z = Math.random() * 800 - 400;
          mesh.rotation.y = 65;
          scene.add(mesh);
      });
    }
  }, 105000);
}

function startRender() {

    var elapsedTime = clock.getElapsedTime();

    requestAnimationFrame(startButton);

    updateCubes(effect, .0005 * (Date.now() - start), numBlobs);

    // Renders "luz" text, exported from blender as .json

    var loader = new THREE.JSONLoader();
    var materialLuz = new THREE.MeshBasicMaterial( { color: 0x000000 } );

    if ( elapsedTime < 120 ) {
      for( var i = 0 ; i < 2 ; i++) {
        loader.load('json/luz.json', function(geometry) {
            var luzMesh = new THREE.Mesh(geometry, materialLuz);
            var scale = 10;
            luzMesh.scale.x = scale;
            luzMesh.scale.y = scale;
            luzMesh.scale.z = scale;
            luzMesh.position.x = Math.random() * 1000 - 400;
            luzMesh.position.y = Math.random() * 1000 - 400;
            luzMesh.position.z = Math.random() * 1000 - 400;
            luzMesh.rotation.y = Math.random() * 180;
            scene.add(luzMesh);

            setTimeout(function() {
              if( luzMesh ) {
                materialLuz.color.setHex(0xffffff);
              }
              if( sphereMaterial ) {
                sphereMaterial.uniforms.color.value = new THREE.Color(0xffffff);
              }
            }, 146500);
        });
      }
    }

    eEleDisse();
    eleDisse();
    disseHaja();
    luz();

    setTimeout(function() {
        document.getElementById('text10').classList.add('invisible');
    }, 6000);

    setTimeout(function() {
        document.getElementById('text11').classList.add('invisible');
    }, 18000);

    setTimeout(function() {
        document.getElementById('text12').classList.add('invisible-long');
    }, 30000);

    setTimeout(function() {
        document.getElementById('flashTwo').classList.add('second-flash');
    }, 143000);

    setTimeout(function() {
        document.getElementById('text1').classList.add('invisible');
    }, 156000);

    setTimeout(function() {
        document.getElementById('text2').classList.add('invisible');
    }, 171000);

    setTimeout(function() {
        document.getElementById('text3').classList.add('invisible-long');
    }, 185000);

    setTimeout(function() {
        document.getElementById('text4').classList.add('invisible');
    }, 215000);



    // Changes Colors
    /*
    setTimeout(function() {
        if( luzMesh ) {
          materialLuz.color.setHex(0xffffff);
        }
        if( material ) {
          material.uniforms.color.value = new THREE.Color(0xffffff);
        }
        if( sphereMaterial ) {
          sphereMaterial.uniforms.color.value = new THREE.Color(0xffffff);
        }
    }, 15000);
    */

    nlat = Math.max(-85, Math.min(85, nlat));

    lat += (nlat - lat) * .1;
    lon += (nlon - lon) * .1;

    phi = (90 - lat) * Math.PI / 180;
    theta = lon * Math.PI / 180;

    distance += (ndistance - distance) * .005;
    camera.position.x = scene.position.x + distance * Math.sin(phi) * Math.cos(theta);
    camera.position.y = scene.position.y + distance * Math.cos(phi);
    camera.position.z = scene.position.z + distance * Math.sin(phi) * Math.sin(theta);

    camera.position.x = scene.position.x - distance * Math.cos(0.1 * elapsedTime);
    camera.position.z = scene.position.z - distance * Math.sin(0.1 * elapsedTime);

    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    rendererStats.update(renderer);
}
