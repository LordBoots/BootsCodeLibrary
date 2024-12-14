// A performant border image that renders once then stretched it's components to fit rather than stroking a path every update.
// This is on average 112x faster than stroking a path every frame dropping the average render time ber border from 1-2m t0 40-60 Us

class BorderImage extends Phaser.GameObjects.Container {
    constructor(scene, x, y, width, height, cornerRadius = 8, strokeThickness = 2) {
        super(scene, x, y);
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.cornerRadius = cornerRadius;
        this.strokeThickness = strokeThickness;
        this.segmentSize = cornerRadius + this.strokeThickness / 2;
        super.setSize(width, height);
        // Create debug rectangle geometry
        this.debugRect = this.scene.add.rectangle(0, 0, width, height, 0x00ff00, 0.2);
        this.debugRect.setOrigin(0, 0);
        this.add(this.debugRect);
        this.createPreStrokedGraphics();
        this.createPatch();
    }
    createPreStrokedGraphics() {
        const size = (this.segmentSize * 3) + (this.strokeThickness * 2); // Include stroke in size
        if (!this.borderGraphics) {
            this.borderGraphics = new Phaser.GameObjects.Graphics(this.scene);
        }

        // Clear any previous drawing
        this.borderGraphics.clear();

        // Set line style
        this.borderGraphics.lineStyle(this.strokeThickness, 0xff0000);

        // Draw the rounded rectangle path
        this.borderGraphics.strokeRoundedRect(
            this.strokeThickness,
            this.strokeThickness,
            size - (this.strokeThickness * 2),
            size - (this.strokeThickness * 2),
            this.cornerRadius
        );
        // Generate the full border texture
        this.borderGraphics.generateTexture('borderFull', size, size);
        // Get the texture and add frames
        const texture = this.scene.textures.get('borderFull');
        const offset = this.strokeThickness / 2;
        // Corners
        texture.add('topLeft', 0, offset, offset, this.segmentSize, this.segmentSize);
        texture.add('topRight', 0, size - this.segmentSize - offset, offset, this.segmentSize, this.segmentSize);
        texture.add('bottomLeft', 0, offset, size - this.segmentSize - offset, this.segmentSize, this.segmentSize);
        texture.add('bottomRight', 0, size - this.segmentSize - offset, size - this.segmentSize - offset, this.segmentSize, this.segmentSize);
        // Edges
        texture.add('top', 0, this.segmentSize + offset, offset, this.segmentSize, this.segmentSize);
        texture.add('bottom', 0, this.segmentSize + offset, size - this.segmentSize - offset, this.segmentSize, this.segmentSize);
        texture.add('left', 0, offset, this.segmentSize + offset, this.segmentSize, this.segmentSize);
        texture.add('right', 0, size - this.segmentSize - offset, this.segmentSize + offset, this.segmentSize, this.segmentSize);
    }


    createPatch() {
        // Create all border pieces using the same texture with different rotations
        // Position corners relative to their center points
        this.topLeft = this.scene.add.image(0, 0, 'borderFull', 'topLeft')
            .setOrigin(0, 0);
        this.topRight = this.scene.add.image(this.width - this.segmentSize, 0, 'borderFull', 'topRight')
            .setOrigin(0, 0);
        this.bottomLeft = this.scene.add.image(0, this.height - this.segmentSize, 'borderFull', 'bottomLeft')
            .setOrigin(0, 0);
        this.bottomRight = this.scene.add.image(this.width - this.segmentSize, this.height - this.segmentSize, 'borderFull', 'bottomRight')
            .setOrigin(0, 0);

        if (this.width / this.segmentSize <= 2) {
            this.top = this.scene.add.image(this.segmentSize, 0, 'borderFull', 'top').setOrigin(0, 0)
                .setDisplaySize(0, this.segmentSize);
            this.bottom = this.scene.add.image(this.segmentSize, this.height - this.segmentSize, 'borderFull', 'bottom').setOrigin(0, 0)
                .setDisplaySize(0, this.segmentSize);
        } else {
            this.top = this.scene.add.image(this.segmentSize, 0, 'borderFull', 'top').setOrigin(0, 0)
                .setDisplaySize(this.width - (this.segmentSize * 2), this.segmentSize);
            this.bottom = this.scene.add.image(this.segmentSize, this.height - this.segmentSize, 'borderFull', 'bottom').setOrigin(0, 0)
                .setDisplaySize(this.width - (this.segmentSize * 2), this.segmentSize);
        }


        if (this.height / this.segmentSize <= 2) {
            this.left = this.scene.add.image(0, this.segmentSize, 'borderFull', 'left').setOrigin(0, 0)
                .setDisplaySize(this.segmentSize, 0);
            this.right = this.scene.add.image(this.width - this.segmentSize, this.segmentSize, 'borderFull', 'right').setOrigin(0, 0)
                .setDisplaySize(this.segmentSize, 0);
        } else {
            this.left = this.scene.add.image(0, this.segmentSize, 'borderFull', 'left').setOrigin(0, 0)
                .setDisplaySize(this.segmentSize, this.height - 2 * this.segmentSize);
            this.right = this.scene.add.image(this.width - this.segmentSize, this.segmentSize, 'borderFull', 'right').setOrigin(0, 0)
                .setDisplaySize(this.segmentSize, this.height - 2 * this.segmentSize);
        }

        // Add all pieces to container
        this.add([this.topLeft, this.topRight, this.bottomLeft, this.bottomRight,
            this.top, this.bottom, this.left, this.right
        ]);
    }
    setSize(width, height) {
        super.setSize(width, height);
        this.updateSize();
    }
    updateSize() {
        this.updateDebugGraphic();
        // Update corner positions
        this.topLeft.setPosition(0, 0);
        this.topRight.setPosition(this.width - this.segmentSize, 0);
        this.bottomLeft.setPosition(0, this.height - this.segmentSize);
        this.bottomRight.setPosition(this.width - this.segmentSize, this.height - this.segmentSize);

        // Update horizontal edges position and size
        if (this.width / this.segmentSize <= 2) {
            this.top.setPosition(this.segmentSize, 0)
                .setDisplaySize(0, this.segmentSize);
            this.bottom.setPosition(this.segmentSize, this.height - this.segmentSize)
                .setDisplaySize(0, this.segmentSize);
        } else {
            this.top.setPosition(this.segmentSize, 0)
                .setDisplaySize(this.width - (this.segmentSize * 2), this.segmentSize);
            this.bottom.setPosition(this.segmentSize, this.height - this.segmentSize)
                .setDisplaySize(this.width - (this.segmentSize * 2), this.segmentSize);
        }

        // Update vertical edges position and size
        if (this.height / this.segmentSize <= 2) {
            this.left.setPosition(0, this.segmentSize)
                .setDisplaySize(this.segmentSize, 0);
            this.right.setPosition(this.width - this.segmentSize, this.segmentSize)
                .setDisplaySize(this.segmentSize, 0);
        } else {
            this.left.setPosition(0, this.segmentSize)
                .setDisplaySize(this.segmentSize, this.height - 2 * this.segmentSize);
            this.right.setPosition(this.width - this.segmentSize, this.segmentSize)
                .setDisplaySize(this.segmentSize, this.height - 2 * this.segmentSize);
        }
    }
    updateDebugGraphic() {
        this.debugRect.setSize(this.width, this.height);
    }
}

