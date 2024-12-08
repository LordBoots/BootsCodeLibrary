// Units are in metres - 1 unit = 1 metre. 
// North = Y - 1, South = Y + 1, East = X + 1, West = X - 1, Up = Z + 1, Down = Z - 1.  
// Positive Z value = above Zaxis (closer ot camera).  Negative Z value = below Zaxis. (further from camera)
class Psuedo3DEngine extends Phaser.Scene {
    // Lifecycle Methods
    constructor() {
        super('Psuedo3DEngine');
        this.camera = new Camera3D(0, 0, 15, 800, 600); // Update camera dimensions
        this.objects = [];
        this.objectsMap = new Map();
        this.floorGrid = null;
        this.overGrid = null;
        this.gridEnabled = true;
        this.overGridEnabled = false;
        this.wallDrawingTechniques = ['solid', 'wireframe', 'shaded'];
        this.currentWallDrawingTechnique = 0;
        this.labels = [];
        this.viewportWidth = 800;
        this.viewportHeight = 600;
        this.drawOrderIndex = 0; // New property for draw order
        this.drawOrders = [
            'Bottom to Top'
        ];
    }
    updateGridSeparation(separation) {
        if (this.floorGrid) {
            this.floorGrid.updateSeparation(separation);
        }
        if (this.subGrid) {
            this.subGrid.updateSeparation(separation);
        }
        this.renderScene();
    }
    create() {
        this.cameras.main.setViewport(0, 0, 800, 600);
        if (!this.scene.get('ViewportScene')) {
            this.viewportScene = this.scene.add('ViewportScene', ViewportScene, true);
            this.viewportScene.scene.start('ViewportScene', {
                camera: this.camera
            });
        } else {
            this.viewportScene = this.scene.get('ViewportScene');
            this.viewportScene.scene.restart({
                camera: this.camera
            });
        }
        this.scene.launch('UI');
        this.scene.get('ViewportScene').events.once('create', () => {
            this.renderScene();
        });
    }
    update() {
        let needsUpdate = this.viewportScene.handleInput();
        if (needsUpdate) {
            this.renderScene();
        }
    }
    // Scene Management
    addObject(object, reference) {
        if (!(object instanceof Object3D)) {
            console.error('Attempted to add non-Object3D to the scene');
            return;
        }
        if (object instanceof Room3D) {
            this.room = object;
        }
        this.objects.push(object);
        if (reference) {
            if (this.objectsMap.has(reference)) {
                console.warn(`Object with reference "${reference}" already exists. Overwriting.`);
            }
            this.objectsMap.set(reference, object);
        }
    }
    removeObject(reference) {
        const index = this.objects.findIndex(obj => obj === this.objectsMap.get(reference));
        if (index !== -1) {
            this.objects.splice(index, 1);
            this.objectsMap.delete(reference);
        }
    }
    // Rendering
    renderScene() {
        if (!this.viewportScene || !this.viewportScene.isReady) return;
        this.viewportScene.clear();
        let allElements = [...this.getAllPlanes(), ...this.getAllLines()];
        let wireframeLines = [];
        allElements = this.sortElementsByDistance(allElements);
        allElements.forEach(element => {
            if (element instanceof Plane3D) {
                const lines = this.renderPlane(element);
                wireframeLines = wireframeLines.concat(lines);
            } else if (element instanceof Line3D) {
                this.renderLine(element);
            }
        });
        // Render wireframe lines
        wireframeLines.forEach(line => this.renderLine(line));
        Object.values(this.labels).forEach(label => {
            label.update(this.camera);
            this.renderLabel(label);
        });
        this.viewportScene.draw();
    }
    renderPlane(plane) {
        const vertices = plane.getVertices();
        const projectedPoints = vertices.map(p => this.project(p));
        const graphics = this.viewportScene.getGraphics();
        if (plane.type === 'grid') {
            graphics.lineStyle(1, plane.color, 1);
            graphics.beginPath();
            graphics.moveTo(projectedPoints[0].x, projectedPoints[0].y);
            graphics.lineTo(projectedPoints[1].x, projectedPoints[1].y);
            graphics.strokePath();
        } else {
            const technique = this.wallDrawingTechniques[this.currentWallDrawingTechnique];
            switch (technique) {
                case 'solid':
                    this.drawWallSolid(projectedPoints, plane.color, this.viewportScene);
                    break;
                case 'wireframe':
                    return this.drawWallWireframe(vertices);
                case 'shaded':
                    this.drawWallShaded(plane, projectedPoints, this.viewportScene);
                    break;
            }
        }
        return [];
    }
    renderLine(line) {
        const projectedStart = this.project(line.start);
        const projectedEnd = this.project(line.end);
        const graphics = this.viewportScene.getGraphics();
        graphics.lineStyle(1, line.color, 1);
        graphics.beginPath();
        graphics.moveTo(projectedStart.x, projectedStart.y);
        graphics.lineTo(projectedEnd.x, projectedEnd.y);
        graphics.strokePath();
    }
    renderLabel(label) {
        const pos = label.getProjectedPosition();
        const textObject = this.viewportScene.add.text(pos.x, pos.y, label.text, {
            font: label.options.font,
            fill: label.options.fill
        });
        textObject.setOrigin(0.5);
        // The text is now directly visible in the scene, no need to draw it to a texture
    }
    drawWallWireframe(vertices) {
        return this.createWireframeLines(vertices);
    }
    drawWallSolid(projectedPoints, color, viewport) {
        const graphics = viewport.getGraphics();
        graphics.fillStyle(color);
        graphics.beginPath();
        graphics.moveTo(projectedPoints[0].x, projectedPoints[0].y);
        for (let i = 1; i < projectedPoints.length; i++) {
            graphics.lineTo(projectedPoints[i].x, projectedPoints[i].y);
        }
        graphics.closePath();
        graphics.fillPath();
    }
    drawLine3D(line, viewport) {
        const graphics = viewport.getGraphics();
        graphics.lineStyle(1, line.color, 1);
        graphics.beginPath();
        graphics.moveTo(line.start.x, line.start.y);
        graphics.lineTo(line.end.x, line.end.y);
        graphics.strokePath();
    }
    drawWallShaded(plane, projectedPoints, viewport) {
        const graphics = viewport.getGraphics();
        const normal = this.calculatePlaneNormal(plane.getVertices());
        const lightDirection = {
            x: 0.5, // Slight angle on x-axis
            y: -0.5, // Slight angle on y-axis
            z: -1 // Still mostly from above
        }; // Light coming from above and slightly angled
        const normalizedLight = this.normalizeVector(lightDirection);
        const dotProduct = this.dotProduct(normal, normalizedLight);
        const shadeFactor = Math.max(0.2, Math.abs(dotProduct)); // Ensure minimum brightness
        const shadedColor = this.shadeColor(plane.color, shadeFactor);

        graphics.fillStyle(shadedColor);
        graphics.beginPath();
        graphics.moveTo(projectedPoints[0].x, projectedPoints[0].y);
        for (let i = 1; i < projectedPoints.length; i++) {
            graphics.lineTo(projectedPoints[i].x, projectedPoints[i].y);
        }
        graphics.closePath();
        graphics.fillPath();
    }
    calculatePlaneNormal(vertices) {
        const v1 = this.subtractVectors(vertices[1], vertices[0]);
        const v2 = this.subtractVectors(vertices[2], vertices[0]);
        return this.normalizeVector(this.crossProduct(v1, v2));
    }
    subtractVectors(a, b) {
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z
        };
    }
    crossProduct(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }
    normalizeVector(v) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return {
            x: v.x / length,
            y: v.y / length,
            z: v.z / length
        };
    }
    dotProduct(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    shadeColor(color, factor) {
        const r = ((color >> 16) & 255) * factor;
        const g = ((color >> 8) & 255) * factor;
        const b = (color & 255) * factor;
        return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
    }
    // Object Management
    getAllPlanes() {
        let planes = [];
        this.objects.forEach(object => {
            if (object.getPlanes) {
                planes = planes.concat(object.getPlanes());
            }
        });
        return planes;
    }
    getAllLines() {
        let lines = [];
        this.objects.forEach(object => {
            if (object instanceof Grid3D) {
                lines = lines.concat(object.lines);
            } else if (object instanceof LinePlane3D) {
                lines = lines.concat(object.getLines());
            }
        });
        return lines;
    }
    // Utility Functions
    project(point) {
        return this.camera.project(point);
    }
    sortElementsByDistance(elements) {
        const getCenter = (element) => element instanceof Plane3D ? element.getCenter() : element.start;
        // Always sort Bottom to Top
        return elements.sort((a, b) => getCenter(a).z - getCenter(b).z);
    }
    distanceToCamera(point) {
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.z !== 'number') {
            console.warn('Invalid point in distanceToCamera:', point);
            return Infinity;
        }
        const dx = point.x - this.camera.x;
        const dy = point.y - this.camera.y;
        const dz = point.z - this.camera.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    createWireframeLines(projectedPoints) {
        const lines = [];
        for (let i = 0; i < projectedPoints.length; i++) {
            const start = projectedPoints[i];
            const end = projectedPoints[(i + 1) % projectedPoints.length];
            lines.push(new Line3D(start, end, 0xFFFFFF));
        }
        return lines;
    }
    cleanupLabels() {
        this.labels = {};
    }
    toggleRenderOrder() {
        this.renderOrderFrontToBack = !this.renderOrderFrontToBack;
    }
}
class ViewportScene extends Phaser.Scene {
    constructor() {
        super('ViewportScene');
    }
    init(data) {
        this.camera = data.camera;
    }
    create() {
        this.isReady = false;
        this.cameras.main.setViewport(0, 0, 800, 600); // Adjust viewport size to match game size
        this.graphics = this.add.graphics();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');
        this.input.on('pointermove', this.handleMouseMove, this);
        this.input.on('wheel', this.handleMouseWheel, this);
        this.isReady = true;
        this.events.emit('create');
    }
    handleInput() {
        if (!this.camera) {
            console.warn('Camera not initialized in ViewportScene');
            return false;
        }
        const moveSpeed = 0.1;
        let moved = false;
        let dx = 0,
            dy = 0;
        if (this.keys.W.isDown) {
            dy -= moveSpeed;
            moved = true;
        }
        if (this.keys.S.isDown) {
            dy += moveSpeed;
            moved = true;
        }
        if (this.keys.A.isDown) {
            dx -= moveSpeed;
            moved = true;
        }
        if (this.keys.D.isDown) {
            dx += moveSpeed;
            moved = true;
        }
        if (moved) {
            this.camera.move(dx, dy);
            return true;
        }
        return false;
    }
    handleMouseMove(pointer) {
        if (pointer.isDown) {
            const dx = pointer.x - pointer.prevPosition.x;
            const dy = pointer.y - pointer.prevPosition.y;
            this.camera.move(-dx * 0.01, -dy * 0.01);
            return true;
        }
        return false;
    }
    handleMouseWheel(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        this.camera.zoom(deltaY);
        return true;
    }
    clear() {
        this.graphics.clear();
    }
    draw() {
        // No need to do anything here as graphics are drawn directly
    }
    getGraphics() {
        return this.graphics;
    }
    setSize(width, height) {
        // No need to adjust size for graphics
    }
}
class Object3D {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vertices = [];
        this.faceIndices = [];
        this.type = '';
        this.size = 0;
        this.color = 0xFFFFFF;
    }
    getElements() {
        // This method should be overridden by subclasses
        return {};
    }
    getCenter() {
        return {
            x: this.x,
            y: this.y,
            z: this.z
        };
    }
    getVertices() {
        return this.vertices;
    }
    calculateCenter(vertices) {
        const sum = vertices.reduce((acc, v) => ({
            x: acc.x + v.x,
            y: acc.y + v.y,
            z: acc.z + v.z
        }), {
            x: 0,
            y: 0,
            z: 0
        });
        return {
            x: sum.x / vertices.length,
            y: sum.y / vertices.length,
            z: sum.z / vertices.length
        };
    }
    getPlanes() {
        return this.faceIndices.map(face => new Plane3D(
            this.type,
            face.map(i => this.vertices[i]),
            this.size,
            this.size,
            null,
            this.color
        ));
    }
    transform(dx = 0, dy = 0, dz = 0) {
        // Update position
        this.x += dx;
        this.y += dy;
        this.z += dz;
        // Transform vertices
        this.vertices = this.vertices.map(v => ({
            x: v.x + dx,
            y: v.y + dy,
            z: v.z + dz
        }));
        // If the object has a method to regenerate vertices (like Cube or Room3D),
        // call it to ensure consistency
        if (typeof this.generateVertices === 'function') {
            this.vertices = this.generateVertices();
        }
    }
    scale(factor) {
        // Apply scaling
        this.size *= factor;
        // Scale vertices
        this.vertices = this.vertices.map(v => ({
            x: (v.x - this.x) * factor + this.x,
            y: (v.y - this.y) * factor + this.y,
            z: (v.z - this.z) * factor + this.z
        }));
        // If the object has a method to regenerate vertices, call it
        if (typeof this.generateVertices === 'function') {
            this.vertices = this.generateVertices();
        }
    }
    rotate(angleX = 0, angleY = 0, angleZ = 0) {
        // Convert angles to radians
        const radX = angleX * Math.PI / 180;
        const radY = angleY * Math.PI / 180;
        const radZ = angleZ * Math.PI / 180;

        // Create rotation matrices
        const rotationMatrix = this.createRotationMatrix(radX, radY, radZ);

        // Calculate the center of the object
        const center = this.calculateCenter();

        // Apply rotation to vertices
        this.vertices = this.vertices.map(v => {
            // Translate vertex to origin
            let x = v.x - center.x;
            let y = v.y - center.y;
            let z = v.z - center.z;

            // Apply rotation
            const newX = rotationMatrix[0][0] * x + rotationMatrix[0][1] * y + rotationMatrix[0][2] * z;
            const newY = rotationMatrix[1][0] * x + rotationMatrix[1][1] * y + rotationMatrix[1][2] * z;
            const newZ = rotationMatrix[2][0] * x + rotationMatrix[2][1] * y + rotationMatrix[2][2] * z;

            // Translate back
            return {
                x: newX + center.x,
                y: newY + center.y,
                z: newZ + center.z
            };
        });

        // Update object's position to new center
        const newCenter = this.calculateCenter();
        this.x = newCenter.x;
        this.y = newCenter.y;
        this.z = newCenter.z;

        // If the object has a method to regenerate vertices, call it
        if (typeof this.generateVertices === 'function') {
            this.vertices = this.generateVertices();
        }
    }

    createRotationMatrix(radX, radY, radZ) {
        const cx = Math.cos(radX);
        const sx = Math.sin(radX);
        const cy = Math.cos(radY);
        const sy = Math.sin(radY);
        const cz = Math.cos(radZ);
        const sz = Math.sin(radZ);

        return [
            [cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz],
            [cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz],
            [-sy, sx * cy, cx * cy]
        ];
    }

    calculateCenter() {
        const sum = this.vertices.reduce((acc, v) => ({
            x: acc.x + v.x,
            y: acc.y + v.y,
            z: acc.z + v.z
        }), {
            x: 0,
            y: 0,
            z: 0
        });

        return {
            x: sum.x / this.vertices.length,
            y: sum.y / this.vertices.length,
            z: sum.z / this.vertices.length
        };
    }
}
class Plane3D extends Object3D {
    constructor(type, vertices, width, height, textureKey = null, color = 0xFFFFFF) {
        super(0, 0, 0); // Initialize with default position
        this.type = type;
        this.vertices = vertices || []; // Ensure vertices is always an array
        this.width = width;
        this.height = height;
        this.textureKey = textureKey;
        this.color = color;

        if (this.vertices.length > 0) {
            const center = this.calculateCenter(this.vertices);
            this.x = center.x;
            this.y = center.y;
            this.z = center.z;
        }
    }
    calculateCenter(vertices) {
        if (!vertices || vertices.length === 0) {
            return {
                x: 0,
                y: 0,
                z: 0
            };
        }
        const sum = vertices.reduce((acc, v) => ({
            x: acc.x + v.x,
            y: acc.y + v.y,
            z: acc.z + v.z
        }), {
            x: 0,
            y: 0,
            z: 0
        });
        return {
            x: sum.x / vertices.length,
            y: sum.y / vertices.length,
            z: sum.z / vertices.length
        };
    }
}
class Line3D extends Object3D {
    constructor(start, end, color = 0xFFFFFF) {
        super(start.x, start.y, start.z);
        this.start = start;
        this.end = end;
        this.color = color;
        this.vertices = [start, end];
    }
    getElements() {
        return [this.start, this.end];
    }
    getProjectedLine(camera) {
        return new Line3D(
            camera.project(this.start),
            camera.project(this.end),
            this.color
        );
    }
}
class Camera3D {
    constructor(x = 0, y = 0, z = 15, viewportWidth = 600, viewportHeight = 450) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.setViewportSize(viewportWidth, viewportHeight);
        this.zScaleFactor = 2; // Changed from 0.5 to 2 to match LinePlane3D
    }
    setViewportSize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }
    move(dx, dy, dz = 0) {
        this.x += dx;
        this.y += dy;
        this.z += dz;
    }
    zoom(deltaY) {
        const zoomSpeed = 0.001;
        this.z += deltaY * zoomSpeed; // Normal zoom direction
        // Adjusted zoom range for the new perspective
        this.z = Phaser.Math.Clamp(this.z, 5, 30);
    }
    project(point) {
        let zDist = this.z - point.z / this.zScaleFactor; // Changed multiplication to division
        let scale = this.viewportHeight / (2 * Math.max(zDist, 0.1)); // Prevent division by zero
        let x2d = (point.x - this.x) * scale + this.viewportWidth / 2;
        let y2d = (point.y - this.y) * scale + this.viewportHeight / 2;
        return {
            x: x2d,
            y: y2d
        };
    }
    setViewportSize(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    }
}
class Cube extends Object3D {
    constructor(x, y, z, size = 1) {
        super(x, y, z);
        this.size = size;
        this.type = 'cube';
        this.color = 0xFF0000; // Red color for cubes
        this.vertices = this.generateVertices();
        this.faceIndices = [
            [0, 1, 2, 3], // front
            [5, 4, 7, 6], // back
            [4, 0, 3, 7], // left
            [1, 5, 6, 2], // right
            [4, 5, 1, 0], // bottom
            [3, 2, 6, 7] // top
        ];
    }
    generateVertices() {
        const s = this.size / 2;
        return [{
            x: -s,
            y: -s,
            z: -s
        }, {
            x: s,
            y: -s,
            z: -s
        }, {
            x: s,
            y: s,
            z: -s
        }, {
            x: -s,
            y: s,
            z: -s
        }, {
            x: -s,
            y: -s,
            z: s
        }, {
            x: s,
            y: -s,
            z: s
        }, {
            x: s,
            y: s,
            z: s
        }, {
            x: -s,
            y: s,
            z: s
        }].map(v => ({
            x: v.x + this.x,
            y: v.y + this.y,
            z: v.z + this.z
        }));
    }
}
class Grid3D extends Object3D {
    constructor(size = 100, separation = 5, x = 0, y = 0, z = 0, color = 0x444444) {
        super(x, y, z);
        this.size = size;
        this.separation = separation;
        this.color = color;
        this.lines = this.generateGridLines();
    }
    updateSeparation(separation) {
        this.separation = separation;
        this.lines = this.generateGridLines();
    }
    generateGridLines() {
        const lines = [];
        const halfSize = this.size / 2;
        // Generate horizontal lines
        for (let y = -halfSize; y <= halfSize; y += this.separation) {
            lines.push(new Line3D({
                    x: -halfSize + this.x,
                    y: y + this.y,
                    z: this.z
                }, {
                    x: halfSize + this.x,
                    y: y + this.y,
                    z: this.z
                },
                this.color
            ));
        }
        // Generate vertical lines
        for (let x = -halfSize; x <= halfSize; x += this.separation) {
            lines.push(new Line3D({
                    x: x + this.x,
                    y: -halfSize + this.y,
                    z: this.z
                }, {
                    x: x + this.x,
                    y: halfSize + this.y,
                    z: this.z
                },
                this.color
            ));
        }
        return lines;
    }
    getPlanes() {
        return this.lines.map(line => {
            return new Plane3D(
                'grid',
                [line.start, line.end],
                0, // Width not applicable for grid lines
                0, // Height not applicable for grid lines
                null,
                line.color
            );
        });
    }
}
class Room3D extends Object3D {
    constructor(width = 10, height = 10, wallHeight = 3, x = 0, y = 0, z = 0) {
        super(x, y, z);
        this.width = width;
        this.height = height;
        this.wallHeight = wallHeight;
        this.type = 'room';
        this.vertices = this.generateVertices();
        this.faceIndices = [
            [0, 1, 2, 3], // floor
            [0, 3, 7, 4], // left wall
            [1, 5, 6, 2], // right wall
            [3, 2, 6, 7], // back wall
            [0, 4, 5, 1] // front wall
        ];
    }
    setDimensions(width, height, wallHeight) {
        this.width = width;
        this.height = height;
        this.wallHeight = wallHeight;
        this.vertices = this.generateVertices();
    }
    generateVertices() {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        return [
            // Floor vertices
            {
                x: -halfWidth,
                y: -halfHeight,
                z: 0
            }, {
                x: halfWidth,
                y: -halfHeight,
                z: 0
            }, {
                x: halfWidth,
                y: halfHeight,
                z: 0
            }, {
                x: -halfWidth,
                y: halfHeight,
                z: 0
            },
            // Wall top vertices
            {
                x: -halfWidth,
                y: -halfHeight,
                z: this.wallHeight
            }, {
                x: halfWidth,
                y: -halfHeight,
                z: this.wallHeight
            }, {
                x: halfWidth,
                y: halfHeight,
                z: this.wallHeight
            }, {
                x: -halfWidth,
                y: halfHeight,
                z: this.wallHeight
            }
        ].map(v => ({
            x: v.x + this.x,
            y: v.y + this.y,
            z: v.z + this.z
        }));
    }
    getDimensions() {
        return {
            width: this.width,
            height: this.height,
            wallHeight: this.wallHeight
        };
    }
    getPlanes() {
        return this.faceIndices.map((face, index) => {
            const isFloor = index === 0;
            return new Plane3D(
                this.type,
                face.map(i => this.vertices[i]),
                isFloor ? this.width : this.wallHeight,
                isFloor ? this.height : this.wallHeight,
                'brickTexture',
                isFloor ? 0x808080 : 0xAAAAAA
            );
        });
    }
}
class LinePlane3D extends Object3D {
    constructor(x = 0, y = 0, z = 0, width = 10, height = 10, orientation = 'xy', lineSpacing = 1, color = 0xFFFFFF) {
        super(x, y, z);
        this.width = width;
        this.height = height;
        this.orientation = orientation;
        this.lineSpacing = lineSpacing / 2; // Reduce density by 4 times
        this.color = color;
        this.lines = this.generateLines();
    }
    generateLines() {
        const lines = [];
        const [dim1, dim2] = this.orientation.split('');
        const horizontalDim = dim1 === 'y' ? dim2 : dim1;
        const verticalDim = dim1 === 'y' ? dim1 : dim2;
        const horizontalRange = horizontalDim === 'z' ? this.height : this.width;
        const verticalRange = verticalDim === 'z' ? this.height : this.width;
        // Generate lines along the vertical dimension
        for (let i = -verticalRange / 2; i <= verticalRange / 2; i += this.lineSpacing) {
            const start = {
                [horizontalDim]: -horizontalRange / 2,
                [verticalDim]: i,
                [this.orientation.replace(horizontalDim, '').replace(verticalDim, '')]: 0
            };
            const end = {
                [horizontalDim]: horizontalRange / 2,
                [verticalDim]: i,
                [this.orientation.replace(horizontalDim, '').replace(verticalDim, '')]: 0
            };
            start.x = (start.x || 0) + this.x;
            start.y = (start.y || 0) + this.y;
            start.z = (start.z || 0) + this.z;
            end.x = (end.x || 0) + this.x;
            end.y = (end.y || 0) + this.y;
            end.z = (end.z || 0) + this.z;
            lines.push(new Line3D(start, end, this.color));
        }
        return lines;
    }
    getLines() {
        return this.lines;
    }
}
class AxisHelper extends Object3D {
    constructor(size = 1) {
        super(0, 0, 0);
        this.size = size;
        this.elements = this.generateElements();
    }
    generateElements() {
        return {
            x: [{
                x: 0,
                y: 0,
                z: 0
            }, {
                x: this.size,
                y: 0,
                z: 0
            }],
            y: [{
                x: 0,
                y: 0,
                z: 0
            }, {
                x: 0,
                y: this.size,
                z: 0
            }],
            z: [{
                x: 0,
                y: 0,
                z: 0
            }, {
                x: 0,
                y: 0,
                z: this.size
            }]
        };
    }
    getElements() {
        return this.elements;
    }
}
class UI extends Phaser.Scene {
    constructor() {
        super({
            key: 'UI',
            active: true
        });
    }
    create() {
        this.cameras.main.setViewport(0, 0, 800, 600);
        this.uiDepth = 1000;
        let nextY = 50;
        nextY = this.createButton('technique', 700, nextY, 'Change Technique', 'solid');
        nextY = this.createButton('grid', 700, nextY, 'Toggle Grid', true, true);
        nextY = this.createButton('overgrid', 700, nextY, 'Toggle OverGrid', false, true);
        this.createGridSizeButtons(700, nextY);
        // Make sure UI doesn't block input to the main scene
        this.input.setTopOnly(false);
        // Create and add the axis helper
        this.axisHelper = new AxisHelper(80); // Reduced size
        this.drawAxisHelper();
    }
    addUIElement(element) {
        element.setDepth(this.uiDepth).setScrollFactor(0);
        return element;
    }
    createGridSizeButtons(x, y) {
        const sizes = [1, 2.5, 5, 10];
        const buttonWidth = 40;
        const spacing = 10;
        const totalWidth = (buttonWidth * sizes.length) + (spacing * (sizes.length - 1));
        let startX = x - (totalWidth / 2) + (buttonWidth / 2);
        this.gridSizeButtons = sizes.map((size, index) => {
            const button = this.addUIElement(this.add.text(startX + (buttonWidth + spacing) * index, y, `${size}m`, {
                font: '14px Arial',
                fill: '#00FF00',
                backgroundColor: '#000000',
                padding: {
                    x: 5,
                    y: 5
                }
            }).setInteractive().setOrigin(0.5));

            button.on('pointerdown', () => {
                const engine = this.scene.get('Psuedo3DEngine');
                engine.updateGridSeparation(size);
                this.updateGridSizeButtonStyles(button);
            });

            return button;
        });

        // Set initial active button
        this.updateGridSizeButtonStyles(this.gridSizeButtons[1]); // 2.5m button (index 1)
    }
    updateGridSizeButtonStyles(activeButton) {
        this.gridSizeButtons.forEach(button => {
            button.setBackgroundColor(button === activeButton ? '#00FF00' : '#000000');
            button.setColor(button === activeButton ? '#000000' : '#00FF00');
        });
    }
    createGridSeparationSlider(x, y) {
        const sliderWidth = 100;
        const sliderHeight = 10;
        const sliderTrack = this.add.rectangle(x, y, sliderWidth, sliderHeight, 0x888888);
        const sliderHandle = this.add.circle(x, y, 8, 0x00FF00);
        sliderHandle.setInteractive({
            draggable: true
        });
        const label = this.add.text(x, y - 20, 'Grid Separation: 5.0m', {
            font: '14px Arial',
            fill: '#00FF00'
        }).setOrigin(0.5);
        sliderHandle.on('drag', (pointer, dragX) => {
            const minX = x - sliderWidth / 2;
            const maxX = x + sliderWidth / 2;
            sliderHandle.x = Phaser.Math.Clamp(dragX, minX, maxX);
            const separation = Phaser.Math.Linear(5, 0.2, (sliderHandle.x - minX) / sliderWidth);
            const roundedSeparation = Math.round(separation * 10) / 10; // Round to 1 decimal place
            label.setText(`Grid Separation: ${roundedSeparation.toFixed(1)}m`);
            const engine = this.scene.get('Psuedo3DEngine');
            engine.updateGridSeparation(roundedSeparation);
        });
        this.container.add([sliderTrack, sliderHandle, label]);
    }
    drawAxisHelper() {
        const axisGraphics = this.addUIElement(this.add.graphics());
        const camera = new Camera3D(0, 0, 200);
        camera.x = -40;
        camera.y = 40;
        camera.z = 200;
        const elements = this.axisHelper.getElements();
        const colors = {
            x: 0xFF0000,
            y: 0x00FF00,
            z: 0x0000FF
        };
        const labels = {
            x: 'X',
            y: 'Y',
            z: 'Z'
        };
        const offsetX = 50 - 150; // Moved 150px left
        const offsetY = 50 - 100; // Moved 100px up
        const scale = 0.4; // Keeping the same scale
        for (const [axis, points] of Object.entries(elements)) {
            const start = camera.project(points[0]);
            const end = camera.project(points[1]);
            const startX = start.x * scale + offsetX;
            const startY = start.y * scale + offsetY;
            const endX = end.x * scale + offsetX;
            const endY = end.y * scale + offsetY;
            axisGraphics.lineStyle(2, colors[axis], 1);
            axisGraphics.beginPath();
            axisGraphics.moveTo(startX, startY);
            axisGraphics.lineTo(endX, endY);
            axisGraphics.strokePath();
            this.addUIElement(this.add.text(endX, endY, labels[axis], {
                font: '12px Arial', // Reduced font size
                fill: '#FFFFFF'
            }).setOrigin(0.5));
        }
    }
    createButton(type, x, y, text, initialValue, isToggle = false) {
        const button = this.addUIElement(this.add.text(x, y, text, {
            font: '16px Arial',
            fill: '#00FF00',
            backgroundColor: '#000000',
            padding: {
                x: 10,
                y: 5
            }
        }).setInteractive().setOrigin(0.5));
        const labelText = isToggle ? (initialValue ? 'ON' : 'OFF') : (type === 'technique' ? 'solid' : initialValue);
        const label = this.addUIElement(this.add.text(x, y + 25, labelText, {
            font: '14px Arial',
            fill: '#00FF00'
        }).setOrigin(0.5));
        button.on('pointerdown', () => {
            const engine = this.scene.get('Psuedo3DEngine');
            if (isToggle) {
                switch (type) {
                    case 'grid':
                        this.toggleGrid();
                        label.setText(engine.floorGrid ? 'ON' : 'OFF');
                        break;
                    case 'overgrid':
                        this.toggleOverGrid();
                        label.setText(engine.overGrid ? 'ON' : 'OFF');
                        break;
                }
            } else if (type === 'technique') {
                engine.currentWallDrawingTechnique = (engine.currentWallDrawingTechnique + 1) % engine.wallDrawingTechniques.length;
                label.setText(engine.wallDrawingTechniques[engine.currentWallDrawingTechnique]);
                if (engine.wallDrawingTechniques[engine.currentWallDrawingTechnique] === 'shaded') {
                    label.setText('Shaded');
                }
            } else if (type === 'drawOrder') {
                engine.drawOrderIndex = (engine.drawOrderIndex + 1) % engine.drawOrders.length;
                label.setText(engine.drawOrders[engine.drawOrderIndex]);
            }
            engine.renderScene();
        });
        return y + 50; // Return the Y position for the next button
    }
    toggleGrid() {
        const engine = this.scene.get('Psuedo3DEngine');
        if (engine.floorGrid) {
            engine.removeObject('floorGrid');
            engine.floorGrid = null;
        } else {
            engine.floorGrid = new Grid3D(100, 2, 0, 0, -0.001, 0x444444);
            engine.addObject(engine.floorGrid, 'floorGrid');
        }
        engine.renderScene();
    }
    toggleOverGrid() {
        const engine = this.scene.get('Psuedo3DEngine');
        if (engine.overGrid) {
            engine.removeObject('overGrid');
            engine.overGrid = null;
        } else {
            engine.overGrid = new Grid3D(100, 2, 0, 0, 3, 0xFFA500);
            engine.addObject(engine.overGrid, 'overGrid');
        }
        engine.renderScene();
    }
    updateGridSeparation(separation) {
        const engine = this.scene.get('Psuedo3DEngine');
        engine.floorGrid.updateSeparation(separation);
        if (engine.overGrid) {
            engine.overGrid.updateSeparation(separation);
        }
        engine.renderScene();
    }
}
class LineRoom3D extends Object3D {
    constructor(width = 10, depth = 10, height = 3, x = 0, y = 0, z = 0, lineSpacing = 0.25, color = 0xFFFFFF) {
        super(x, y, z);
        this.width = width;
        this.depth = depth;
        this.height = height;
        this.lineSpacing = lineSpacing;
        this.color = color;
        this.walls = this.createWalls();
    }
    createWalls() {
        return [
            // Floor
            new LinePlane3D(this.x, this.y, this.z, this.width, this.depth, 'xy', this.lineSpacing, this.color),
            // Left wall (West)
            new LinePlane3D(this.x - this.width / 2, this.y, this.z + this.height / 2, this.depth, this.height, 'yz', this.lineSpacing, this.color),
            // Right wall (East)
            new LinePlane3D(this.x + this.width / 2, this.y, this.z + this.height / 2, this.depth, this.height, 'yz', this.lineSpacing, this.color),
            // Front wall (South)
            new LinePlane3D(this.x, this.y - this.depth / 2, this.z + this.height / 2, this.width, this.height, 'xz', this.lineSpacing, this.color),
            // Back wall (North)
            new LinePlane3D(this.x, this.y + this.depth / 2, this.z + this.height / 2, this.width, this.height, 'xz', this.lineSpacing, this.color)
        ];
    }
    addToEngine(engine, reference) {
        this.walls.forEach((wall, index) => {
            engine.addObject(wall, `${reference}_wall_${index}`);
        });
    }
    getLines() {
        return this.walls.flatMap(wall => wall.getLines());
    }
}
class Sphere3D extends Object3D {
    constructor(x = 0, y = 0, z = 0, radius = 1, color = 0xFFFFFF, segments = 16) {
        super(x, y, z);
        this.radius = radius;
        this.color = color;
        this.segments = segments;
        this.type = 'sphere';
        this.vertices = this.generateVertices();
        this.faceIndices = this.generateFaceIndices();
    }
    generateVertices() {
        const vertices = [];
        for (let lat = 0; lat <= this.segments; lat++) {
            const theta = lat * Math.PI / this.segments;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            for (let lon = 0; lon <= this.segments; lon++) {
                const phi = lon * 2 * Math.PI / this.segments;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);
                const x = this.x + this.radius * cosPhi * sinTheta;
                const y = this.y + this.radius * sinPhi * sinTheta;
                const z = this.z + this.radius * cosTheta;
                vertices.push({
                    x,
                    y,
                    z
                });
            }
        }
        return vertices;
    }
    generateFaceIndices() {
        const faceIndices = [];
        for (let lat = 0; lat < this.segments; lat++) {
            for (let lon = 0; lon < this.segments; lon++) {
                const first = lat * (this.segments + 1) + lon;
                const second = first + this.segments + 1;
                faceIndices.push([first, second, first + 1]);
                faceIndices.push([second, second + 1, first + 1]);
            }
        }
        return faceIndices;
    }
}
class Cylinder3D extends Object3D {
    constructor(x = 0, y = 0, z = 0, radius = 1, height = 2, color = 0x00FF00, segments = 16) {
        super(x, y, z);
        this.radius = radius;
        this.height = height;
        this.color = color;
        this.segments = segments;
        this.type = 'cylinder';
        this.vertices = this.generateVertices();
        this.faceIndices = this.generateFaceIndices();
    }
    generateVertices() {
        const vertices = [];
        // Top and bottom center points
        vertices.push({
            x: this.x,
            y: this.y,
            z: this.z + this.height / 2
        });
        vertices.push({
            x: this.x,
            y: this.y,
            z: this.z - this.height / 2
        });
        // Circular points
        for (let i = 0; i <= this.segments; i++) {
            const angle = (i / this.segments) * Math.PI * 2;
            const x = this.x + Math.cos(angle) * this.radius;
            const y = this.y + Math.sin(angle) * this.radius;
            vertices.push({
                x,
                y,
                z: this.z + this.height / 2
            });
            vertices.push({
                x,
                y,
                z: this.z - this.height / 2
            });
        }
        return vertices;
    }
    generateFaceIndices() {
        const faceIndices = [];
        // Top and bottom faces
        for (let i = 0; i < this.segments; i++) {
            faceIndices.push([0, i * 2 + 2, i * 2 + 4]);
            faceIndices.push([1, i * 2 + 3, i * 2 + 5]);
        }
        // Side faces
        for (let i = 0; i < this.segments; i++) {
            faceIndices.push([i * 2 + 2, i * 2 + 3, i * 2 + 4]);
            faceIndices.push([i * 2 + 3, i * 2 + 5, i * 2 + 4]);
        }
        return faceIndices;
    }
}
class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.engine = null;
    }
    create() {
        this.engine = this.scene.get('Psuedo3DEngine');
        // Create objects
        const room = new Room3D(20, 20, 3, 0, 0, 0); // 20x20 meters, centered in the world
        this.engine.addObject(room, 'mainRoom');
        this.engine.addObject(new Cube(0, 0, 0.5), 'centralCube');
        this.engine.addObject(new Cube(-9, 2.25, 0.5), 'northWestCube');
        this.engine.addObject(new Cube(9, 2.25, 0.5), 'northEastCube');
        // Add a new cube for circular motion
        this.circularCube = new Cube(3, 0, 0.5);
        this.engine.addObject(this.circularCube, 'circularCube');
        // Add a new LinePlane3D
        const linePlane = new LinePlane3D(-6, 0, 1.5, 2, 2, 'yz', 0.8, 0xFFFFFF);
        this.engine.addObject(linePlane, 'verticalLinePlane');
        // Add the new LineRoom3D 40 meters south of its previous position
        const lineRoom = new LineRoom3D(10, 10, 3, 0, 35, 0, 1, 0x00FFFF);
        lineRoom.addToEngine(this.engine, 'lineRoom');
        // Add a new Sphere3D
        const sphere = new Sphere3D(5, -5, 1.5, 1, 0xFF00FF, 16);
        this.engine.addObject(sphere, 'purpleSphere');
        // Add a new Cylinder3D
        const cylinder = new Cylinder3D(-5, 5, 1.5, 0.5, 3, 0x00FF00, 16);
        this.engine.addObject(cylinder, 'greenCylinder');
        // Set up circular motion properties
        this.circleRadius = 3;
        this.circleSpeedXZ = 0.02;
        this.circleSpeedYZ = 0.015;
        this.circleAngleXZ = 0;
        this.circleAngleYZ = 0;
        this.engine.floorGrid = new Grid3D(100, 2, 0, 0, -0.001, 0x444444);
        this.engine.addObject(this.engine.floorGrid, 'floorGrid');
        // The overGrid is not created by default, it will be created when toggled on
        // Render the initial scene
        this.engine.renderScene();
    }
    update() {
        // Game logic update
        this.updatePlayerMovement();
        this.checkGameConditions();
        // Update circular cube position
        this.updateCircularCube();
    }
    updateCircularCube() {
        // Calculate new position
        const newX = Math.cos(this.circleAngleXZ) * this.circleRadius;
        const newY = Math.sin(this.circleAngleYZ) * this.circleRadius;
        const newZ = (Math.sin(this.circleAngleXZ) + Math.cos(this.circleAngleYZ)) * this.circleRadius * 0.5;
        // Calculate the change in position
        const dx = newX - this.circularCube.x;
        const dy = newY - this.circularCube.y;
        const dz = newZ - this.circularCube.z;
        // Transform the cube
        this.circularCube.transform(dx, dy, dz);
        // If you want to add rotation, you can do so like this:
        this.circularCube.rotate(0, this.circleAngleXZ * 180 / Math.PI, 0);
        // Update the angles for next frame
        this.circleAngleXZ += this.circleSpeedXZ;
        this.circleAngleYZ += this.circleSpeedYZ;
        // Render the updated scene
        this.engine.renderScene();
    }
    addPlayer() {
        // Implement player creation here
    }
    setupCollisions() {
        // Implement collision setup here
    }
    setupControls() {
        // Implement control setup here
    }
    updatePlayerMovement() {
        // Implement player movement here
    }
    checkGameConditions() {
        // Implement game condition checks here
    }
}
const container = document.getElementById('renderDiv');
// Create a canvas element
const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
document.getElementById('renderDiv').appendChild(canvas);
const config = {
    type: Phaser.WEBGL,
    canvas: canvas,
    parent: 'renderDiv',
    pixelArt: false,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    width: 800,
    height: 600,
    backgroundColor: '#4488AA',
    scene: [Psuedo3DEngine, ViewportScene, UI, Game],
    callbacks: {
        postBoot: function(game) {
            game.scene.start('Psuedo3DEngine');
            game.scene.start('Game');
            game.scene.scenes.forEach(function(scene) {
                scene.sys.settings.visible = true;
            });
        }
    },
    canvasStyle: 'width: 100%; height: 100%;'
};
window.phaserGame = new Phaser.Game(config);