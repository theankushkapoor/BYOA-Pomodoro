class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.currentMode = 'work';
        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.totalTime = 25 * 60;
        this.sessionCount = 1;
        this.sessionsBeforeLongBreak = 4;
        this.timer = null;
        
        // Settings
        this.settings = {
            workTime: 25,
            shortBreakTime: 5,
            longBreakTime: 15,
            sessionsBeforeLongBreak: 4
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.timeDisplay = document.getElementById('time');
        this.sessionInfo = document.getElementById('session-info');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.progressFill = document.getElementById('progress-fill');
        this.currentSessionSpan = document.getElementById('current-session');
        this.totalSessionsSpan = document.getElementById('total-sessions');
        
        // Settings inputs
        this.workTimeInput = document.getElementById('work-time');
        this.shortBreakTimeInput = document.getElementById('short-break-time');
        this.longBreakTimeInput = document.getElementById('long-break-time');
        this.sessionsBeforeLongBreakInput = document.getElementById('sessions-before-long-break');
        
        // Session control buttons
        this.sessionButtons = document.querySelectorAll('[data-mode]');
    }
    
    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Session control buttons
        this.sessionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMode(e.target.dataset.mode);
            });
        });
        
        // Settings change events
        this.workTimeInput.addEventListener('change', () => this.updateSettings());
        this.shortBreakTimeInput.addEventListener('change', () => this.updateSettings());
        this.longBreakTimeInput.addEventListener('change', () => this.updateSettings());
        this.sessionsBeforeLongBreakInput.addEventListener('change', () => this.updateSettings());
    }
    
    updateSettings() {
        this.settings.workTime = parseInt(this.workTimeInput.value);
        this.settings.shortBreakTime = parseInt(this.shortBreakTimeInput.value);
        this.settings.longBreakTime = parseInt(this.longBreakTimeInput.value);
        this.settings.sessionsBeforeLongBreak = parseInt(this.sessionsBeforeLongBreakInput.value);
        
        this.sessionsBeforeLongBreak = this.settings.sessionsBeforeLongBreak;
        this.totalSessionsSpan.textContent = this.sessionsBeforeLongBreak;
        
        // Update current timer if not running
        if (!this.isRunning) {
            this.updateTimerForCurrentMode();
        }
    }
    
    switchMode(mode) {
        if (this.isRunning) {
            if (!confirm('Timer is running. Do you want to switch modes?')) {
                return;
            }
            this.pause();
        }
        
        this.currentMode = mode;
        this.updateTimerForCurrentMode();
        this.updateSessionButtons();
        this.updateDisplay();
    }
    
    updateTimerForCurrentMode() {
        switch (this.currentMode) {
            case 'work':
                this.timeLeft = this.settings.workTime * 60;
                this.totalTime = this.settings.workTime * 60;
                break;
            case 'short-break':
                this.timeLeft = this.settings.shortBreakTime * 60;
                this.totalTime = this.settings.shortBreakTime * 60;
                break;
            case 'long-break':
                this.timeLeft = this.settings.longBreakTime * 60;
                this.totalTime = this.settings.longBreakTime * 60;
                break;
        }
    }
    
    updateSessionButtons() {
        this.sessionButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === this.currentMode) {
                btn.classList.add('active');
            }
        });
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        clearInterval(this.timer);
    }
    
    reset() {
        this.pause();
        this.updateTimerForCurrentMode();
        this.updateDisplay();
    }
    
    completeSession() {
        this.pause();
        this.playNotification();
        this.showCompletionMessage();
        
        // Auto-switch to next mode
        this.autoSwitchMode();
    }
    
    autoSwitchMode() {
        if (this.currentMode === 'work') {
            this.sessionCount++;
            this.currentSessionSpan.textContent = this.sessionCount;
            
            if (this.sessionCount % this.sessionsBeforeLongBreak === 0) {
                this.switchMode('long-break');
            } else {
                this.switchMode('short-break');
            }
        } else {
            // Break completed, switch back to work
            this.switchMode('work');
        }
    }
    
    playNotification() {
        // Create audio context for notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio notification not supported');
        }
    }
    
    showCompletionMessage() {
        const messages = {
            'work': 'Work session completed! Time for a break.',
            'short-break': 'Short break completed! Ready to work?',
            'long-break': 'Long break completed! Great job!'
        };
        
        const message = messages[this.currentMode] || 'Session completed!';
        
        // Add visual feedback
        this.timeDisplay.classList.add('timer-complete');
        setTimeout(() => {
            this.timeDisplay.classList.remove('timer-complete');
        }, 500);
        
        // Show notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', { body: message });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Pomodoro Timer', { body: message });
                }
            });
        }
        
        // Show alert as fallback
        setTimeout(() => {
            alert(message);
        }, 100);
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update session info
        const sessionNames = {
            'work': 'Work Session',
            'short-break': 'Short Break',
            'long-break': 'Long Break'
        };
        this.sessionInfo.textContent = sessionNames[this.currentMode];
        
        // Update progress bar
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
        this.progressFill.style.width = `${progress}%`;
        
        // Update session count
        this.currentSessionSpan.textContent = this.sessionCount;
        this.totalSessionsSpan.textContent = this.sessionsBeforeLongBreak;
        
        // Update document title when timer is running
        this.updateTitle();
    }
    
    updateTitle() {
        if (this.isRunning) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            const sessionNames = {
                'work': 'Work',
                'short-break': 'Short Break',
                'long-break': 'Long Break'
            };
            
            document.title = `(${timeString}) ${sessionNames[this.currentMode]} - Pomodoro Timer`;
        } else {
            document.title = 'Pomodoro Timer';
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const pomodoroTimer = new PomodoroTimer();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}); 