import * as THREE from 'three';
import { Player } from './components/Player.js';
import { Environment } from './components/Environment.js';
import { ObstacleManager } from './components/ObstacleManager.js';
import { InputHandler } from './utils/InputHandler.js';
import { Collectible } from './components/Collectible.js';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        // Check if mobile device for optimizations
        this.isMobile = this.checkIfMobile();
        
        // Game state
        this.score = 0;
        this.gameSpeed = 15;
        this.baseGameSpeed = 15;
        this.initialGameSpeed = 15;
        this.maxGameSpeed = 40;
        this.speedIncreaseRate = 0.1; // Base speed increase per second
        this.isGameOver = false;
        this.isGameStarted = false;
        this.gameTime = 0; // Track how long the game has been running
        this.isPaused = false;
        
        // Power-up states
        this.activePowerups = {
            magnet: { active: false, timeRemaining: 0 },
            shield: { active: false, timeRemaining: 0 },
            multiplier: { active: false, timeRemaining: 0, value: 1 }
        };
        
        // Visual indicators for active powerups
        this.powerupIndicators = {
            magnet: null,
            shield: null,
            multiplier: null
        };
        
        // UI elements
        this.scoreElement = null;
        this.speedElement = null;
        this.powerupUIElements = {};
        
        // Add fog to create depth
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 150);
        
        this.initialize();
    }
    
    checkIfMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    initialize() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB); // Sky blue background
        this.renderer.shadowMap.enabled = true;
        
        // Optimize for mobile
        if (this.isMobile) {
            this.renderer.setPixelRatio(window.devicePixelRatio * 0.7); // Reduce resolution for better performance
            this.renderer.shadowMap.enabled = false; // Disable shadows on mobile for performance
            this.scene.fog.far = 100; // Reduce fog distance
        } else {
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Setup camera - improved position for better view
        this.camera.position.set(0, 8, 12);
        this.camera.lookAt(0, 0, -15);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 10);
        
        // Only enable shadows on desktop for performance
        if (!this.isMobile) {
            directionalLight.castShadow = true;
            // Improve shadow quality
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -50;
        }
        
        this.scene.add(directionalLight);
        
        // Add a subtle spotlight to follow player
        this.playerLight = new THREE.SpotLight(0xffffff, 0.8);
        this.playerLight.position.set(0, 10, 5);
        this.playerLight.angle = Math.PI / 6;
        this.playerLight.penumbra = 0.5;
        this.playerLight.decay = 1;
        this.playerLight.distance = 30;
        
        if (!this.isMobile) {
            this.playerLight.castShadow = true;
        }
        
        this.scene.add(this.playerLight);
        
        // Initialize game components
        this.player = new Player(this.scene);
        this.environment = new Environment(this.scene);
        this.obstacleManager = new ObstacleManager(this.scene);
        this.inputHandler = new InputHandler();
        
        // Setup UI
        this.setupUI();
        
        // Handle window resize and visibility changes
        window.addEventListener('resize', () => this.onWindowResize(), false);
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Setup UI event listeners
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('restart-button').addEventListener('click', () => this.restartGame());
        
        // Setup powerup visual indicators in game world
        this.setupPowerupIndicators();
        
        // Start animation loop
        this.animate();
    }
    
    setupUI() {
        // Get score display element
        this.scoreElement = document.getElementById('score-display');
        
        // Get speed display element
        this.speedElement = document.getElementById('game-speed');
        
        // Create power-up UI elements
        const powerupContainer = document.createElement('div');
        powerupContainer.id = 'powerup-container';
        powerupContainer.style.cssText = 'position: absolute; top: 60px; left: 20px; display: flex; flex-direction: column;';
        document.getElementById('game-container').appendChild(powerupContainer);
        
        // Create UI elements for each powerup type
        const powerupTypes = [
            { id: 'magnet', name: 'Magnet', color: '#FF0000' },
            { id: 'shield', name: 'Shield', color: '#00AAFF' },
            { id: 'multiplier', name: 'Multiplier', color: '#00FF00' }
        ];
        
        powerupTypes.forEach(powerup => {
            const element = document.createElement('div');
            element.id = `powerup-${powerup.id}`;
            element.className = 'powerup-indicator';
            element.style.cssText = `
                margin: 5px 0;
                padding: 5px 10px;
                background-color: ${powerup.color};
                color: white;
                border-radius: 4px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                display: none;
            `;
            element.textContent = `${powerup.name}: 0s`;
            powerupContainer.appendChild(element);
            
            this.powerupUIElements[powerup.id] = element;
        });
        
        // Add pause button for mobile
        if (this.isMobile) {
            this.createPauseButton();
        }
    }
    
    createPauseButton() {
        const pauseButton = document.createElement('div');
        pauseButton.id = 'pause-button';
        pauseButton.innerHTML = '⏸️';
        pauseButton.style.cssText = `
            position: absolute;
            top: 20px;
            right: 80px;
            width: 30px;
            height: 30px;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            z-index: 150;
            font-size: 20px;
            -webkit-tap-highlight-color: transparent;
        `;
        
        pauseButton.addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('game-container').appendChild(pauseButton);
    }
    
    togglePause() {
        if (this.isGameStarted && !this.isGameOver) {
            this.isPaused = !this.isPaused;
            
            // Update pause button appearance
            const pauseButton = document.getElementById('pause-button');
            if (pauseButton) {
                pauseButton.innerHTML = this.isPaused ? '▶️' : '⏸️';
            }
            
            // Show pause message
            if (this.isPaused) {
                this.showPauseMessage();
            } else {
                this.hidePauseMessage();
            }
        }
    }
    
    showPauseMessage() {
        // Create pause message if it doesn't exist
        if (!document.getElementById('pause-message')) {
            const pauseMessage = document.createElement('div');
            pauseMessage.id = 'pause-message';
            pauseMessage.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-size: 24px;
                text-align: center;
                z-index: 300;
            `;
            pauseMessage.textContent = 'PAUSED';
            document.getElementById('game-container').appendChild(pauseMessage);
        } else {
            document.getElementById('pause-message').style.display = 'block';
        }
    }
    
    hidePauseMessage() {
        const pauseMessage = document.getElementById('pause-message');
        if (pauseMessage) {
            pauseMessage.style.display = 'none';
        }
    }
    
    handleVisibilityChange() {
        if (document.hidden && this.isGameStarted && !this.isGameOver) {
            // Auto-pause the game when tab/app is not visible
            if (!this.isPaused) {
                this.togglePause();
            }
        }
    }
    
    setupPowerupIndicators() {
        // Create a visual indicator for the shield
        const shieldGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x00AAFF,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.powerupIndicators.shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.powerupIndicators.shield.visible = false;
        this.scene.add(this.powerupIndicators.shield);
        
        // Create a visual indicator for the magnet
        const magnetGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const magnetMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.5
        });
        
        this.powerupIndicators.magnet = new THREE.Mesh(magnetGeometry, magnetMaterial);
        this.powerupIndicators.magnet.visible = false;
        this.scene.add(this.powerupIndicators.magnet);
        
        // Create a visual indicator for the multiplier
        const multiplierGeometry = new THREE.RingGeometry(1.8, 2, 16);
        const multiplierMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FF00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.powerupIndicators.multiplier = new THREE.Mesh(multiplierGeometry, multiplierMaterial);
        this.powerupIndicators.multiplier.rotation.x = Math.PI / 2; // Lay flat
        this.powerupIndicators.multiplier.visible = false;
        this.scene.add(this.powerupIndicators.multiplier);
    }
    
    startGame() {
        document.getElementById('start-screen').style.display = 'none';
        this.isGameStarted = true;
        this.gameTime = 0;
        this.clock.start();
        
        // Update UI
        this.updateScoreDisplay();
        this.updateSpeedDisplay();
    }
    
    restartGame() {
        document.getElementById('game-over').style.display = 'none';
        this.score = 0;
        this.gameSpeed = this.initialGameSpeed;
        this.baseGameSpeed = this.initialGameSpeed;
        this.isGameOver = false;
        this.isPaused = false;
        this.gameTime = 0;
        
        // Reset power-ups
        this.resetPowerups();
        
        // Reset game components
        this.player.reset();
        this.obstacleManager.reset();
        this.environment.reset();
        
        this.isGameStarted = true;
        this.clock.start();
        
        // Update UI
        this.updateScoreDisplay();
        this.updateSpeedDisplay();
        this.hidePauseMessage();
    }
    
    resetPowerups() {
        // Reset all powerup states
        for (const type in this.activePowerups) {
            this.activePowerups[type].active = false;
            this.activePowerups[type].timeRemaining = 0;
            if (type === 'multiplier') {
                this.activePowerups[type].value = 1;
            }
            
            // Hide UI elements
            if (this.powerupUIElements[type]) {
                this.powerupUIElements[type].style.display = 'none';
            }
            
            // Hide visual indicators
            if (this.powerupIndicators[type]) {
                this.powerupIndicators[type].visible = false;
            }
        }
    }
    
    gameOver() {
        this.isGameOver = true;
        document.getElementById('final-score').textContent = Math.floor(this.score);
        document.getElementById('game-over').style.display = 'block';
    }
    
    updateScoreDisplay() {
        // Format score to always show whole number
        if (this.scoreElement) {
            this.scoreElement.textContent = `Score: ${Math.floor(this.score)}`;
        }
    }
    
    updateSpeedDisplay() {
        // Update speed display
        if (this.speedElement) {
            this.speedElement.textContent = `Speed: ${Math.floor(this.gameSpeed)}`;
        }
    }
    
    updatePowerupUI() {
        // Update each powerup UI element
        for (const type in this.activePowerups) {
            const powerup = this.activePowerups[type];
            const element = this.powerupUIElements[type];
            
            if (element) {
                if (powerup.active) {
                    element.style.display = 'block';
                    let text = `${type.charAt(0).toUpperCase() + type.slice(1)}: ${Math.ceil(powerup.timeRemaining)}s`;
                    
                    if (type === 'multiplier') {
                        text = `${text} (${powerup.value}x)`;
                    }
                    
                    element.textContent = text;
                } else {
                    element.style.display = 'none';
                }
            }
        }
    }
    
    activatePowerup(type, duration, value = null) {
        if (this.activePowerups[type]) {
            // If powerup is already active, just extend the duration
            if (this.activePowerups[type].active) {
                this.activePowerups[type].timeRemaining += duration;
            } else {
                this.activePowerups[type].active = true;
                this.activePowerups[type].timeRemaining = duration;
                
                // Set special values for specific powerups
                if (type === 'multiplier' && value) {
                    this.activePowerups[type].value = value;
                }
                
                // Show visual indicator
                if (this.powerupIndicators[type]) {
                    this.powerupIndicators[type].visible = true;
                }
            }
            
            // Show notification
            this.showPowerupNotification(type, duration);
        }
    }
    
    showPowerupNotification(type, duration) {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'powerup-notification';
        notification.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 15px 30px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border-radius: 8px;
            font-size: 24px;
            font-family: Arial, sans-serif;
            z-index: 100;
            animation: fadeOut 2s forwards;
        `;
        
        // Set color based on powerup type
        let color = '#FFFFFF';
        let text = '';
        
        switch(type) {
            case 'magnet':
                color = '#FF0000';
                text = `Magnet activated for ${duration}s!`;
                break;
            case 'shield':
                color = '#00AAFF';
                text = `Shield activated for ${duration}s!`;
                break;
            case 'multiplier':
                color = '#00FF00';
                text = `${this.activePowerups.multiplier.value}x Score for ${duration}s!`;
                break;
        }
        
        notification.style.color = color;
        notification.textContent = text;
        
        // Add to screen
        document.getElementById('game-container').appendChild(notification);
        
        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    updatePowerups(delta) {
        // Update each powerup state
        for (const type in this.activePowerups) {
            const powerup = this.activePowerups[type];
            
            if (powerup.active) {
                powerup.timeRemaining -= delta;
                
                // Check if powerup has expired
                if (powerup.timeRemaining <= 0) {
                    powerup.active = false;
                    
                    // Reset special values
                    if (type === 'multiplier') {
                        powerup.value = 1;
                    }
                    
                    // Hide visual indicator
                    if (this.powerupIndicators[type]) {
                        this.powerupIndicators[type].visible = false;
                    }
                } else {
                    // Update visual indicators
                    this.updatePowerupVisuals(type, delta);
                }
            }
        }
        
        // Update UI
        this.updatePowerupUI();
    }
    
    updatePowerupVisuals(type, delta) {
        // Update visual effects for active powerups
        const playerPos = this.player.getPosition();
        
        if (type === 'shield' && this.powerupIndicators.shield) {
            this.powerupIndicators.shield.position.copy(playerPos);
            this.powerupIndicators.shield.material.opacity = 0.2 + 0.1 * Math.sin(this.gameTime * 3);
        }
        
        if (type === 'magnet' && this.powerupIndicators.magnet) {
            // Position magnet indicator in front of player
            const magnetPos = playerPos.clone();
            magnetPos.z -= 3;
            magnetPos.y += 2;
            this.powerupIndicators.magnet.position.copy(magnetPos);
            this.powerupIndicators.magnet.rotation.y += delta * 5;
        }
        
        if (type === 'multiplier' && this.powerupIndicators.multiplier) {
            this.powerupIndicators.multiplier.position.copy(playerPos);
            this.powerupIndicators.multiplier.position.y = 0.1;
            this.powerupIndicators.multiplier.rotation.z += delta * 2;
            this.powerupIndicators.multiplier.material.opacity = 0.2 + 0.1 * Math.sin(this.gameTime * 2);
        }
    }
    
    updateScore(points = 1) {
        // Apply multiplier if active
        const multiplier = this.activePowerups.multiplier.active ? this.activePowerups.multiplier.value : 1;
        
        // Add points
        this.score += points * multiplier;
        
        // Update score display
        this.updateScoreDisplay();
    }
    
    updateGameSpeed(delta) {
        // Calculate time-based speed increase (exponential)
        const elapsedMinutes = this.gameTime / 60;
        const exponentialFactor = Math.pow(1.05, elapsedMinutes);
        
        // Update base game speed based on time
        this.baseGameSpeed = this.initialGameSpeed * exponentialFactor;
        
        // Cap the maximum speed
        if (this.baseGameSpeed > this.maxGameSpeed) {
            this.baseGameSpeed = this.maxGameSpeed;
        }
        
        // Set actual game speed
        this.gameSpeed = this.baseGameSpeed;
        
        // Update speed display
        this.updateSpeedDisplay();
    }
    
    update() {
        const delta = this.clock.getDelta();
        
        if (this.isGameStarted && !this.isGameOver && !this.isPaused) {
            // Update game time
            this.gameTime += delta;
            
            // Update game speed
            this.updateGameSpeed(delta);
            
            // Update powerups
            this.updatePowerups(delta);
            
            // Update components
            this.environment.update(delta, this.gameSpeed);
            
            const playerMoved = this.player.update(delta, this.inputHandler);
            
            this.obstacleManager.update(delta, this.gameSpeed);
            
            // Update player spotlight position
            const playerPos = this.player.getPosition();
            this.playerLight.position.set(playerPos.x, 10, playerPos.z + 5);
            this.playerLight.target = this.player.mesh;
            
            // Check collisions with obstacles
            const collisionResult = this.obstacleManager.checkCollisions(
                this.player.getPosition(), 
                this.player.getSize(), 
                this.activePowerups.shield.active
            );
            
            if (collisionResult === true) {
                this.gameOver();
                return;
            } else if (collisionResult === 'shieldHit') {
                // Shield was hit, disable it
                this.activePowerups.shield.active = false;
                this.activePowerups.shield.timeRemaining = 0;
                this.powerupIndicators.shield.visible = false;
                
                // Show shield break notification
                this.showPowerupNotification('shield', 0);
            }
            
            // Check collectibles
            const collectedItem = this.obstacleManager.checkCollectibles(
                this.player.getPosition(), 
                this.player.getSize(), 
                this.activePowerups.magnet.active
            );
            
            if (collectedItem) {
                // Add points from the collectible
                this.updateScore(collectedItem.points);
                
                // Handle powerup effects
                if (collectedItem.type !== 'coin' && collectedItem.duration > 0) {
                    this.activatePowerup(
                        collectedItem.type, 
                        collectedItem.duration, 
                        collectedItem.multiplier
                    );
                }
                
                // Play collect sound
                this.playCollectSound(collectedItem.type);
            }
            
            // Update score based on distance traveled
            if (this.player.isRunning) {
                this.updateScore(delta * this.gameSpeed * 0.05);
            }
        }
    }
    
    playCollectSound(type) {
        // Placeholder for sound - can be implemented later
        console.log(`Collected ${type}!`);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 