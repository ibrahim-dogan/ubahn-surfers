export class InputHandler {
    constructor() {
        this.isJumping = false;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        this.jumpTriggered = false;
        this.leftTriggered = false;
        this.rightTriggered = false;
        
        // Detect if using mobile device
        this.isMobile = this.checkIfMobile();
        
        this.setupControls();
    }
    
    checkIfMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    setupControls() {
        if (this.isMobile) {
            this.setupMobileControls();
        } else {
            this.setupKeyboardControls();
        }
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (!this.leftTriggered) {
                        this.isMovingLeft = true;
                        this.leftTriggered = true;
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (!this.rightTriggered) {
                        this.isMovingRight = true;
                        this.rightTriggered = true;
                    }
                    break;
                case ' ':
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (!this.jumpTriggered) {
                        this.isJumping = true;
                        this.jumpTriggered = true;
                    }
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch(event.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.leftTriggered = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.rightTriggered = false;
                    break;
                case ' ':
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.jumpTriggered = false;
                    break;
            }
        });
    }
    
    setupMobileControls() {
        // Create mobile control overlay
        const controlsOverlay = document.createElement('div');
        controlsOverlay.id = 'mobile-controls';
        controlsOverlay.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 150px;
            display: flex;
            justify-content: space-between;
            padding: 20px;
            z-index: 100;
            pointer-events: none;
        `;
        
        // Create left/right controls container
        const moveControls = document.createElement('div');
        moveControls.style.cssText = `
            display: flex;
            gap: 20px;
            pointer-events: auto;
        `;
        
        // Create left button
        const leftButton = document.createElement('div');
        leftButton.className = 'control-button left-button';
        leftButton.innerHTML = '◀';
        leftButton.style.cssText = `
            width: 70px;
            height: 70px;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 36px;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
        `;
        
        // Create right button
        const rightButton = document.createElement('div');
        rightButton.className = 'control-button right-button';
        rightButton.innerHTML = '▶';
        rightButton.style.cssText = leftButton.style.cssText;
        
        // Create jump button container
        const jumpContainer = document.createElement('div');
        jumpContainer.style.cssText = `
            pointer-events: auto;
        `;
        
        // Create jump button
        const jumpButton = document.createElement('div');
        jumpButton.className = 'control-button jump-button';
        jumpButton.innerHTML = '▲';
        jumpButton.style.cssText = `
            width: 80px;
            height: 80px;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 36px;
            -webkit-tap-highlight-color: transparent;
            user-select: none;
        `;
        
        // Add event listeners for touch controls
        
        // Left button events
        this.addTouchEvents(leftButton, 
            () => {
                if (!this.leftTriggered) {
                    this.isMovingLeft = true;
                    this.leftTriggered = true;
                    leftButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                }
            },
            () => {
                this.leftTriggered = false;
                leftButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        );
        
        // Right button events
        this.addTouchEvents(rightButton, 
            () => {
                if (!this.rightTriggered) {
                    this.isMovingRight = true;
                    this.rightTriggered = true;
                    rightButton.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                }
            },
            () => {
                this.rightTriggered = false;
                rightButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        );
        
        // Jump button events
        this.addTouchEvents(jumpButton, 
            () => {
                if (!this.jumpTriggered) {
                    this.isJumping = true;
                    this.jumpTriggered = true;
                    jumpButton.style.backgroundColor = 'rgba(0, 255, 0, 0.7)';
                }
            },
            () => {
                this.jumpTriggered = false;
                jumpButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }
        );
        
        // Add swipe detection for the entire game area
        const gameContainer = document.getElementById('game-container');
        
        if (gameContainer) {
            let touchStartX = 0;
            let touchStartY = 0;
            const swipeThreshold = 50;
            
            gameContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            gameContainer.addEventListener('touchmove', (e) => {
                if (!touchStartX || !touchStartY) return;
                
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                
                const diffX = touchX - touchStartX;
                const diffY = touchStartY - touchY;
                
                // Check for vertical swipe (jump)
                if (diffY > swipeThreshold && Math.abs(diffY) > Math.abs(diffX)) {
                    if (!this.jumpTriggered) {
                        this.isJumping = true;
                        this.jumpTriggered = true;
                        
                        // Reset after a short delay to prevent multiple jumps
                        setTimeout(() => {
                            this.jumpTriggered = false;
                        }, 500);
                    }
                }
                // Check for horizontal swipe
                else if (Math.abs(diffX) > swipeThreshold && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX > 0 && !this.rightTriggered) {
                        this.isMovingRight = true;
                        this.rightTriggered = true;
                        
                        // Reset after a short delay
                        setTimeout(() => {
                            this.rightTriggered = false;
                        }, 300);
                    } 
                    else if (diffX < 0 && !this.leftTriggered) {
                        this.isMovingLeft = true;
                        this.leftTriggered = true;
                        
                        // Reset after a short delay
                        setTimeout(() => {
                            this.leftTriggered = false;
                        }, 300);
                    }
                }
                
                // Reset touch start values to allow for repeated swipes
                touchStartX = touchX;
                touchStartY = touchY;
            }, { passive: true });
            
            gameContainer.addEventListener('touchend', () => {
                touchStartX = 0;
                touchStartY = 0;
            }, { passive: true });
        }
        
        // Assemble the controls
        moveControls.appendChild(leftButton);
        moveControls.appendChild(rightButton);
        jumpContainer.appendChild(jumpButton);
        
        controlsOverlay.appendChild(moveControls);
        controlsOverlay.appendChild(jumpContainer);
        
        // Add to the DOM when the page loads
        window.addEventListener('DOMContentLoaded', () => {
            document.getElementById('game-container')?.appendChild(controlsOverlay);
        });
        
        // Also setup keyboard controls as fallback
        this.setupKeyboardControls();
    }
    
    addTouchEvents(element, startCallback, endCallback) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startCallback();
        }, { passive: false });
        
        element.addEventListener('touchend', (e) => {
            e.preventDefault();
            endCallback();
        }, { passive: false });
        
        // For handling when touch moves outside the element
        element.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            endCallback();
        }, { passive: false });
    }
    
    resetJumpState() {
        const wasJumping = this.isJumping;
        this.isJumping = false;
        return wasJumping;
    }
    
    resetMoveState() {
        const wasMovingLeft = this.isMovingLeft;
        const wasMovingRight = this.isMovingRight;
        this.isMovingLeft = false;
        this.isMovingRight = false;
        return { left: wasMovingLeft, right: wasMovingRight };
    }
} 