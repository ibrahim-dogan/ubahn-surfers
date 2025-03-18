import * as THREE from 'three';
import { Obstacle } from './Obstacle.js';
import { Collectible } from './Collectible.js';

export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.collectibles = [];
        this.spawnDistance = -120; // Increased distance from player where obstacles spawn
        this.despawnDistance = 20; // Distance from player where obstacles get removed
        this.minSpawnInterval = 0.6; // Slightly increased minimum time between spawns
        this.maxSpawnInterval = 1.8; // Maximum time between spawns
        this.lanePositions = [-4, 0, 4]; // Same as player lanes
        this.timeToNextSpawn = this.getRandomSpawnTime();
        this.collectibleChance = 0.3; // 30% chance of spawning a collectible instead of an obstacle
        
        // Special collectible chances (out of total collectible spawns)
        this.magnetChance = 0.15;      // 15% chance for magnet
        this.shieldChance = 0.15;      // 15% chance for shield
        this.multiplierChance = 0.15;  // 15% chance for multiplier
        // The rest (55%) will be coins
        
        // How often to spawn special collectibles (in seconds)
        this.specialCollectibleTimer = 0;
        this.minTimeBetweenSpecials = 15; // At least 15 seconds between special powerups
        
        // Add pattern spawning
        this.usePatterns = true;
        this.patterns = this.createPatterns();
        this.currentPattern = null;
        this.patternIndex = 0;
        this.patternChance = 0.4; // 40% chance of using a pattern instead of random spawns
    }
    
    createPatterns() {
        // Create predefined patterns of obstacles and collectibles
        return [
            // Pattern 1: Zigzag obstacles with collectible in the middle
            {
                elements: [
                    { type: 'obstacle', lane: 0 },
                    { type: 'obstacle', lane: 1 },
                    { type: 'collectible', lane: 1, collectibleType: 'coin' },
                    { type: 'obstacle', lane: 2 },
                    { type: 'obstacle', lane: 1 }
                ],
                spacing: 1.2 // Time between spawns in this pattern
            },
            // Pattern 2: Wall with one gap
            {
                elements: [
                    { type: 'obstacle', lane: 0 },
                    { type: 'obstacle', lane: 2 },
                    { type: 'collectible', lane: 1, collectibleType: 'coin' }
                ],
                spacing: 0.8
            },
            // Pattern 3: Collectible line
            {
                elements: [
                    { type: 'collectible', lane: 0, collectibleType: 'coin' },
                    { type: 'collectible', lane: 0, collectibleType: 'coin' },
                    { type: 'collectible', lane: 1, collectibleType: 'coin' },
                    { type: 'collectible', lane: 2, collectibleType: 'coin' },
                    { type: 'collectible', lane: 2, collectibleType: 'coin' }
                ],
                spacing: 0.5
            },
            // Pattern 4: Jump challenge
            {
                elements: [
                    { type: 'obstacle', lane: 0 },
                    { type: 'obstacle', lane: 1 },
                    { type: 'obstacle', lane: 2 },
                    { type: 'collectible', lane: 1, collectibleType: 'coin', height: 3 } // Higher collectible that requires jumping
                ],
                spacing: 1.0
            },
            // Pattern 5: Power-up challenge
            {
                elements: [
                    { type: 'obstacle', lane: 0 },
                    { type: 'obstacle', lane: 1 },
                    { type: 'collectible', lane: 2, collectibleType: 'random_powerup' },
                    { type: 'obstacle', lane: 0 },
                    { type: 'obstacle', lane: 2 }
                ],
                spacing: 1.2
            },
            // Pattern 6: Shield needed
            {
                elements: [
                    { type: 'collectible', lane: 1, collectibleType: 'shield' },
                    { type: 'obstacle', lane: 0 },
                    { type: 'obstacle', lane: 1 },
                    { type: 'obstacle', lane: 2 }
                ],
                spacing: 1.0
            },
            // Pattern 7: Multiplier opportunity
            {
                elements: [
                    { type: 'collectible', lane: 1, collectibleType: 'multiplier' },
                    { type: 'collectible', lane: 0, collectibleType: 'coin' },
                    { type: 'collectible', lane: 1, collectibleType: 'coin' },
                    { type: 'collectible', lane: 2, collectibleType: 'coin' },
                    { type: 'collectible', lane: 1, collectibleType: 'coin' },
                    { type: 'collectible', lane: 0, collectibleType: 'coin' }
                ],
                spacing: 0.6
            }
        ];
    }
    
    update(delta, gameSpeed) {
        // Move obstacles and collectibles forward
        this.updateObstacles(delta, gameSpeed);
        this.updateCollectibles(delta, gameSpeed);
        
        // Update special collectible timer
        this.specialCollectibleTimer += delta;
        
        // Spawn new obstacles/collectibles
        this.timeToNextSpawn -= delta;
        
        if (this.timeToNextSpawn <= 0) {
            if (this.currentPattern) {
                // Continue spawning current pattern
                this.spawnPatternElement();
                
                // Check if pattern is complete
                if (this.patternIndex >= this.currentPattern.elements.length) {
                    this.currentPattern = null;
                    this.timeToNextSpawn = this.getRandomSpawnTime() * 1.5; // Longer pause after a pattern
                } else {
                    this.timeToNextSpawn = this.currentPattern.spacing;
                }
            } else {
                // Choose between pattern or random spawn
                if (this.usePatterns && Math.random() < this.patternChance) {
                    // Start a new pattern
                    this.currentPattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
                    this.patternIndex = 0;
                    this.spawnPatternElement();
                    this.timeToNextSpawn = this.currentPattern.spacing;
                } else {
                    // Random spawn
                    if (Math.random() < this.collectibleChance) {
                        this.spawnCollectible();
                    } else {
                        this.spawnObstacle();
                    }
                    this.timeToNextSpawn = this.getRandomSpawnTime();
                }
            }
        }
    }
    
    spawnPatternElement() {
        if (!this.currentPattern || this.patternIndex >= this.currentPattern.elements.length) return;
        
        const element = this.currentPattern.elements[this.patternIndex];
        const lanePosition = this.lanePositions[element.lane];
        
        if (element.type === 'obstacle') {
            const obstacle = new Obstacle(this.scene);
            obstacle.mesh.position.set(lanePosition, 1, this.spawnDistance);
            this.obstacles.push(obstacle);
        } else if (element.type === 'collectible') {
            let collectibleType = element.collectibleType || 'coin';
            
            // Handle special random power-up type
            if (collectibleType === 'random_powerup') {
                collectibleType = this.getRandomPowerupType();
            }
            
            const collectible = new Collectible(this.scene, collectibleType);
            
            // Use specified height or default
            const height = element.height || 1.5;
            collectible.mesh.position.set(lanePosition, height, this.spawnDistance);
            this.collectibles.push(collectible);
        }
        
        this.patternIndex++;
    }
    
    updateObstacles(delta, gameSpeed) {
        const moveDistance = delta * gameSpeed;
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.mesh.position.z += moveDistance;
            
            // Remove obstacles that have passed the player
            if (obstacle.mesh.position.z > this.despawnDistance) {
                this.scene.remove(obstacle.mesh);
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    updateCollectibles(delta, gameSpeed) {
        const moveDistance = delta * gameSpeed;
        
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            collectible.update(delta);
            collectible.mesh.position.z += moveDistance;
            
            // Remove collectibles that have passed the player
            if (collectible.mesh.position.z > this.despawnDistance) {
                this.scene.remove(collectible.mesh);
                this.collectibles.splice(i, 1);
            }
        }
    }
    
    spawnObstacle() {
        // Randomly choose a lane for the obstacle
        const laneIndex = Math.floor(Math.random() * this.lanePositions.length);
        const xPosition = this.lanePositions[laneIndex];
        
        // Create a new obstacle and add it to the scene
        const obstacle = new Obstacle(this.scene);
        obstacle.mesh.position.set(xPosition, 1, this.spawnDistance);
        
        this.obstacles.push(obstacle);
    }
    
    spawnCollectible() {
        // Randomly choose a lane for the collectible
        const laneIndex = Math.floor(Math.random() * this.lanePositions.length);
        const xPosition = this.lanePositions[laneIndex];
        
        // Determine what type of collectible to spawn
        let collectibleType = 'coin';
        
        // Check if we can spawn a special collectible
        if (this.specialCollectibleTimer >= this.minTimeBetweenSpecials) {
            collectibleType = this.getRandomCollectibleType();
            
            // Reset timer if we spawned a special collectible
            if (collectibleType !== 'coin') {
                this.specialCollectibleTimer = 0;
            }
        }
        
        // Create a new collectible and add it to the scene
        const collectible = new Collectible(this.scene, collectibleType);
        
        // Occasionally spawn collectibles at jump height
        const height = Math.random() < 0.3 ? 3 : 1.5;
        collectible.mesh.position.set(xPosition, height, this.spawnDistance);
        
        this.collectibles.push(collectible);
    }
    
    getRandomCollectibleType() {
        const random = Math.random();
        
        if (random < this.magnetChance) {
            return 'magnet';
        } else if (random < this.magnetChance + this.shieldChance) {
            return 'shield';
        } else if (random < this.magnetChance + this.shieldChance + this.multiplierChance) {
            return 'multiplier';
        } else {
            return 'coin';
        }
    }
    
    getRandomPowerupType() {
        const powerups = ['magnet', 'shield', 'multiplier'];
        return powerups[Math.floor(Math.random() * powerups.length)];
    }
    
    checkCollisions(playerPosition, playerSize, hasShield) {
        for (const obstacle of this.obstacles) {
            const obstaclePosition = obstacle.mesh.position;
            const obstacleSize = obstacle.getSize();
            
            // Simple AABB collision detection
            if (Math.abs(obstaclePosition.x - playerPosition.x) < (playerSize.width + obstacleSize.width) / 2 &&
                Math.abs(obstaclePosition.y - playerPosition.y) < (playerSize.height + obstacleSize.height) / 2 &&
                Math.abs(obstaclePosition.z - playerPosition.z) < (playerSize.depth + obstacleSize.depth) / 2) {
                
                // If we have a shield, we're protected but consume the shield
                if (hasShield) {
                    return 'shieldHit';
                }
                
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }
    
    checkCollectibles(playerPosition, playerSize, hasMagnet) {
        let collected = null;
        
        // If we have a magnet, extend the collection range
        const magnetRange = hasMagnet ? 4 : 0;
        
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const collectible = this.collectibles[i];
            const collectiblePosition = collectible.mesh.position;
            const collectibleSize = collectible.getSize();
            
            // Increase collection range if magnet is active
            const collectionWidth = playerSize.width + collectibleSize.width + magnetRange;
            
            // Simple AABB collision detection with extended range for magnet
            if (Math.abs(collectiblePosition.x - playerPosition.x) < collectionWidth / 2 &&
                Math.abs(collectiblePosition.y - playerPosition.y) < (playerSize.height + collectibleSize.height) / 2 &&
                Math.abs(collectiblePosition.z - playerPosition.z) < (playerSize.depth + collectibleSize.depth) / 2) {
                
                // Create a visual effect for collection
                this.createCollectionEffect(collectiblePosition);
                
                // Store the collected item's effect
                collected = collectible.effect;
                collected.type = collectible.type;
                
                // Remove the collected item
                this.scene.remove(collectible.mesh);
                this.collectibles.splice(i, 1);
            }
        }
        
        return collected; // Return the collected item or null
    }
    
    createCollectionEffect(position) {
        // Create a simple particle burst effect
        const particleCount = 10;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 4, 4),
                new THREE.MeshBasicMaterial({ color: 0xFFD700 })
            );
            
            particle.position.copy(position);
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 5,
                    Math.random() * 5,
                    (Math.random() - 0.5) * 5
                ),
                life: 1.0
            };
            
            this.scene.add(particle);
            particles.push(particle);
            
            // Remove particles after 1 second
            setTimeout(() => {
                this.scene.remove(particle);
            }, 1000);
        }
    }
    
    getRandomSpawnTime() {
        return this.minSpawnInterval + Math.random() * (this.maxSpawnInterval - this.minSpawnInterval);
    }
    
    reset() {
        // Remove all obstacles and collectibles
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle.mesh);
        }
        
        for (const collectible of this.collectibles) {
            this.scene.remove(collectible.mesh);
        }
        
        this.obstacles = [];
        this.collectibles = [];
        this.timeToNextSpawn = this.getRandomSpawnTime();
        this.currentPattern = null;
        this.specialCollectibleTimer = 0;
    }
} 