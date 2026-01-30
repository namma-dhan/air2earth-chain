
import * as Cesium from 'cesium';

export type ToolType = 'tree' | 'garden' | 'purifier';

interface ToolConfig {
    id: ToolType;
    name: string;
    subtitle: string;
    modelUrl?: string; // Local URL
    ionAssetId?: number; // fallback
    scale: number;
    heightOffset: number;
}

export const TOOLS: Record<ToolType, ToolConfig> = {
    tree: {
        id: 'tree',
        name: 'Trees',
        subtitle: 'Place on map',
        // Placeholder model URL - user should replace this
        modelUrl: '/assets/tree1.glb',
        scale: 1.5, // Tree size
        heightOffset: 0,
    },
    garden: {
        id: 'garden',
        name: 'Vertical Gardens',
        subtitle: 'Green walls',
        modelUrl: '/assets/vertical-garden.glb',
        scale: 3.0,
        heightOffset: 0,
    },
    purifier: {
        id: 'purifier',
        name: 'Air Purifiers',
        subtitle: 'Clean air units',
        modelUrl: '/assets/purifier.glb',
        scale: 1.5,
        heightOffset: 0,
    }
};

export class PlacementManager {
    private viewer: Cesium.Viewer;
    private activeTool: ToolType | null = null;
    private handler: Cesium.ScreenSpaceEventHandler | null = null;
    private ghostEntity: Cesium.Entity | null = null;
    private placedInstances: Cesium.PrimitiveCollection; // Using Primitives for better perf control if we switch to manual
    private selectedTreeIndex: number | null = null;
    
    // Rotation state for placement preview
    private currentRotation: number = 0; // in degrees
    private currentPosition: Cesium.Cartesian3 | null = null;

    // Storage for our placed items
    private placements: {
        tool: ToolType;
        position: Cesium.Cartesian3;
        heading: number;
        model?: Cesium.Model;
        entity?: Cesium.Entity;
        pickEntity?: Cesium.Entity; // Invisible entity for picking
    }[] = [];

    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer;
        this.placedInstances = new Cesium.PrimitiveCollection();
        this.viewer.scene.primitives.add(this.placedInstances);
        
        // Setup global delete key listener
        this.setupDeleteKeyListener();
        
        // Setup tree click detection
        this.setupTreeClickDetection();
    }

    public startPlacement(tool: ToolType) {
        this.stopPlacement(); // Clear existing
        this.activeTool = tool;
        this.currentRotation = 0; // Reset rotation
        const config = TOOLS[tool];

        console.log(`Starting placement for: ${tool}`);

        // Create a visual indicator that we are in placement mode
        this.viewer.canvas.style.cursor = 'crosshair';

        // Disable default scroll zoom when placing garden (to use scroll for rotation)
        if (tool === 'garden') {
            this.viewer.scene.screenSpaceCameraController.enableZoom = false;
        }

        // Create Ghost Entity (Preview)
        // We use an Entity for the ghost because it's easier to update position reactively
        this.ghostEntity = this.viewer.entities.add({
            model: {
                uri: config.modelUrl,
                scale: config.scale,
                color: Cesium.Color.WHITE.withAlpha(0.7), // Semi-transparent
                colorBlendMode: Cesium.ColorBlendMode.MIX,
                colorBlendAmount: 0.5,
                heightReference: tool === 'garden' ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });

        // Setup Interaction Handler
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

        // MOUSE MOVE: Update Ghost Position
        this.handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
            const position = this.getPickPosition(movement.endPosition);
            if (position && this.ghostEntity) {
                this.currentPosition = position;
                this.ghostEntity.position = new Cesium.ConstantPositionProperty(position);

                // Apply current rotation
                const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(this.currentRotation), 0, 0);
                this.ghostEntity.orientation = new Cesium.ConstantProperty(
                    Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
                );

                this.ghostEntity.show = true;
            } else if (this.ghostEntity) {
                this.ghostEntity.show = false;
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // SCROLL WHEEL: Rotate the model (for garden placement)
        this.handler.setInputAction((delta: number) => {
            if (this.activeTool === 'garden' && this.ghostEntity && this.currentPosition) {
                // Rotate by 15 degrees per scroll step
                this.currentRotation += delta > 0 ? -15 : 15;
                // Keep rotation in 0-360 range
                this.currentRotation = ((this.currentRotation % 360) + 360) % 360;
                
                // Update ghost orientation
                const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(this.currentRotation), 0, 0);
                this.ghostEntity.orientation = new Cesium.ConstantProperty(
                    Cesium.Transforms.headingPitchRollQuaternion(this.currentPosition, hpr)
                );
                
                // Dispatch rotation change event for UI
                window.dispatchEvent(new CustomEvent('rotation-changed', { detail: this.currentRotation }));
            }
        }, Cesium.ScreenSpaceEventType.WHEEL);

        // LEFT CLICK: Place Object
        this.handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
            const position = this.getPickPosition(click.position);
            if (position) {
                this.placeInstance(position);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // RIGHT CLICK: Cancel
        this.handler.setInputAction(() => {
            this.cancelPlacement();
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    }

    public stopPlacement() {
        // Re-enable zoom when stopping placement
        this.viewer.scene.screenSpaceCameraController.enableZoom = true;
        
        if (this.handler) {
            this.handler.destroy();
            this.handler = null;
        }
        if (this.ghostEntity) {
            this.viewer.entities.remove(this.ghostEntity);
            this.ghostEntity = null;
        }
        this.activeTool = null;
        this.currentPosition = null;
        this.currentRotation = 0;
        this.viewer.canvas.style.cursor = 'default';
    }

    public cancelPlacement() {
        this.stopPlacement();
        // Dispatch event or callback to UI to reset selection could be added here
        window.dispatchEvent(new CustomEvent('placement-canceled'));
    }

    public deleteAllTrees() {
        // Remove all tree placements from viewer and storage
        this.placements = this.placements.filter(placement => {
            if (placement.tool === 'tree') {
                if (placement.model) {
                    this.viewer.scene.primitives.remove(placement.model);
                }
                if (placement.entity) {
                    this.viewer.entities.remove(placement.entity);
                }
                return false; // Remove from array
            }
            return true; // Keep non-tree placements
        });
        console.log('All trees deleted');
    }

    public deleteLastTree() {
        // Find and delete the last placed tree
        for (let i = this.placements.length - 1; i >= 0; i--) {
            if (this.placements[i].tool === 'tree') {
                const placement = this.placements[i];
                if (placement.model) {
                    this.viewer.scene.primitives.remove(placement.model);
                }
                if (placement.entity) {
                    this.viewer.entities.remove(placement.entity);
                }
                if (placement.pickEntity) {
                    this.viewer.entities.remove(placement.pickEntity);
                }
                this.placements.splice(i, 1);
                console.log('Last tree deleted');
                return;
            }
        }
    }

    private setupDeleteKeyListener() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedTreeIndex !== null) {
                this.deleteTreeAtIndex(this.selectedTreeIndex);
            }
        });
    }

    private setupTreeClickDetection() {
        const clickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        clickHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
            const pickedObject = this.viewer.scene.pick(click.position);
            
            // Try to find which tree was clicked
            let foundIndex = -1;
            for (let i = 0; i < this.placements.length; i++) {
                if (this.placements[i].pickEntity === pickedObject.id) {
                    foundIndex = i;
                    break;
                }
            }

            if (foundIndex !== -1 && this.placements[foundIndex].tool === 'tree') {
                this.selectedTreeIndex = foundIndex;
                this.highlightTree(foundIndex);
                console.log('Tree selected. Press Delete to remove.');
            } else {
                this.clearTreeSelection();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    private highlightTree(index: number) {
        this.clearTreeSelection();
        const placement = this.placements[index];
        if (placement.pickEntity) {
            placement.pickEntity.show = true;
        }
    }

    private clearTreeSelection() {
        if (this.selectedTreeIndex !== null) {
            const placement = this.placements[this.selectedTreeIndex];
            if (placement.pickEntity) {
                placement.pickEntity.show = false;
            }
        }
        this.selectedTreeIndex = null;
    }

    private deleteTreeAtIndex(index: number) {
        if (index < 0 || index >= this.placements.length) return;
        
        const placement = this.placements[index];
        if (placement.tool === 'tree') {
            if (placement.model) {
                this.viewer.scene.primitives.remove(placement.model);
            }
            if (placement.entity) {
                this.viewer.entities.remove(placement.entity);
            }
            if (placement.pickEntity) {
                this.viewer.entities.remove(placement.pickEntity);
            }
            this.placements.splice(index, 1);
            this.selectedTreeIndex = null;
            console.log('Tree deleted');
        }
    }

    private isTooCloseToOthers(position: Cesium.Cartesian3, minDistanceMeters: number): boolean {
        for (const placement of this.placements) {
            const distance = Cesium.Cartesian3.distance(position, placement.position);
            if (distance < minDistanceMeters) {
                return true;
            }
        }
        return false;
    }

    private getPickPosition(windowPosition: Cesium.Cartesian2): Cesium.Cartesian3 | undefined {
        // Try picking 3D tiles/models first
        const ray = this.viewer.camera.getPickRay(windowPosition);
        if (!ray) return undefined;

        // First try picking scene geometry (buildings/models)
        let position: Cesium.Cartesian3 | undefined = this.viewer.scene.pickPosition(windowPosition);

        // Fallback to globe/terrain if undefined
        if (!Cesium.defined(position)) {
            position = this.viewer.scene.globe.pick(ray, this.viewer.scene);
        }

        return position;
    }

    private async placeInstance(position: Cesium.Cartesian3) {
        if (!this.activeTool) return;
        const config = TOOLS[this.activeTool];

        // Check minimum distance between placements (5 meters for trees, 2 meters for gardens)
        const minDistance = this.activeTool === 'tree' ? 5 : (this.activeTool === 'garden' ? 2 : 20);
        if (this.isTooCloseToOthers(position, minDistance)) {
            console.warn('Too close to another placement. Minimum distance:', minDistance, 'meters');
            return;
        }

        // Use current rotation for gardens, 0 for others
        const heading = this.activeTool === 'garden' 
            ? Cesium.Math.toRadians(this.currentRotation) 
            : Cesium.Math.toRadians(0);
        const pitch = 0;
        const roll = 0;
        const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        // 1. Store Data
        this.placements.push({
            tool: this.activeTool,
            position: position,
            heading: heading
        });

        // Create invisible pickup entity for selection
        const placementIndex = this.placements.length - 1;
        const pickEntity = this.viewer.entities.add({
            position: position,
            box: {
                dimensions: new Cesium.Cartesian3(30, 30, 30),
                material: Cesium.Color.RED.withAlpha(0)
            }
        });
        this.placements[placementIndex].pickEntity = pickEntity;

        // 2. Render
        try {
            const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr);

            const model = await Cesium.Model.fromGltfAsync({
                url: config.modelUrl || '',
                modelMatrix: modelMatrix,
                scale: config.scale,
            });

            this.viewer.scene.primitives.add(model);
            
            // Store model reference for deletion
            this.placements[placementIndex].model = model;

            // Console animation/log
            console.log(`Placed ${config.name} at`, position, `rotation: ${this.currentRotation}°`);

        } catch (error) {
            console.error("Failed to place model. Fallback to placeholder box.", error);

            // Fallback: Simple box if model fails to load
            const entity = this.viewer.entities.add({
                position: position,
                orientation: orientation,
                box: {
                    dimensions: new Cesium.Cartesian3(10, 10, 20),
                    material: Cesium.Color.GREEN
                }
            });
            
            // Store entity reference for deletion
            this.placements[placementIndex].entity = entity;
        }
    }
}
