// キャンバスの設定
const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

// キャンバスのサイズをウィンドウに合わせる
function resizeCanvas() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

// 初期化時とウィンドウサイズ変更時にキャンバスをリサイズ
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 花火の色の配列
const colors = [
    { r: 255, g: 50, b: 50 },    // 赤
    { r: 50, g: 50, b: 255 },    // 青
    { r: 255, g: 255, b: 50 },   // 黄
    { r: 255, g: 150, b: 50 },   // オレンジ
    { r: 255, g: 50, b: 255 },   // ピンク
    { r: 50, g: 255, b: 50 },    // 緑
    { r: 255, g: 255, b: 255 },  // 白
    { r: 255, g: 200, b: 100 }   // 金
];

// パーティクルクラス
class Particle {
    constructor(x, y, color, velocity, gravity, friction, fadeRate, size, trail = false) {
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.originalY = y;
        this.color = color;
        this.velocity = velocity;
        this.gravity = gravity;
        this.friction = friction;
        this.fadeRate = fadeRate;
        this.size = size;
        this.alpha = 1;
        this.trail = trail;
        this.trailPoints = [];
        this.maxTrailLength = 15; // 軌跡の長さを増やす
    }

    // パーティクルの更新
    update() {
        if (this.trail) {
            this.trailPoints.unshift({ x: this.x, y: this.y, alpha: this.alpha });
            if (this.trailPoints.length > this.maxTrailLength) {
                this.trailPoints.pop();
            }
        }

        // 空気抵抗を考慮した物理計算
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // 重力の影響（より正確な物理計算）
        this.velocity.y += this.gravity;
        
        // 風の影響（ランダムな微小変動を加える）
        this.velocity.x += (Math.random() - 0.5) * 0.03;
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.fadeRate;
    }

    // パーティクルの描画
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 軌跡の描画
        if (this.trail) {
            for (let i = 0; i < this.trailPoints.length; i++) {
                const point = this.trailPoints[i];
                const trailAlpha = point.alpha * 0.5 * (1 - i / this.trailPoints.length);
                ctx.globalAlpha = trailAlpha;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // パーティクルが生存しているかどうか
    isAlive() {
        return this.alpha > 0;
    }
}

// 花火クラス
class Firework {
    constructor(x, y, targetX, targetY, color, type, sizeMultiplier = 1.0) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.color = color;
        this.type = type;
        this.sizeMultiplier = sizeMultiplier; // 花火の大きさの倍率
        this.particles = [];
        this.rocket = null;
        this.exploded = false;
        this.createRocket();
    }

    // 打ち上げロケットの作成
    createRocket() {
        // 目標位置までの角度と距離を計算
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        const distance = Math.sqrt(
            Math.pow(this.targetX - this.x, 2) + 
            Math.pow(this.targetY - this.y, 2)
        );
        
        // 距離に応じて速度を調整（より正確に目標位置に到達するため）
        const speed = 8 + Math.random() * 4;
        
        // 初速度ベクトルを計算（物理的に正確な放物線を描くため）
        const velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        
        // より単純で安定した放物線軌道の計算
        const gravity = 0.1;
        // 距離に応じて上向きの初速度を調整
        velocity.y = -Math.sqrt(distance) * 0.4 - 2;
        
        this.rocket = new Particle(
            this.x,
            this.y,
            this.color,
            velocity,
            gravity,  // 重力
            0.98,     // 摩擦
            0.01,     // フェード率
            2 * this.sizeMultiplier,  // サイズ
            true      // 軌跡あり
        );
    }

    // 爆発の作成（パーティクル数を減らして描画負荷を軽減）
    explode() {
        this.exploded = true;
        const particleCount = Math.floor((50 + Math.random() * 50) * this.sizeMultiplier);
        
        // 爆発位置をターゲット位置に合わせる
        const explosionX = this.targetX;
        const explosionY = this.targetY;
        
        // 花火の種類に応じたパターンを作成
        switch (this.type) {
            case 'circle':
                this.createCircleExplosion(particleCount, explosionX, explosionY);
                break;
            case 'chrysanthemum':
                this.createChrysanthemumExplosion(particleCount, explosionX, explosionY);
                break;
            case 'willow':
                this.createWillowExplosion(particleCount, explosionX, explosionY);
                break;
            case 'crossette':
                this.createCrossetteExplosion(particleCount, explosionX, explosionY);
                break;
            case 'ring':
                this.createRingExplosion(particleCount, explosionX, explosionY);
                break;
            case 'random':
            default:
                const types = ['circle', 'chrysanthemum', 'willow', 'crossette', 'ring'];
                const randomType = types[Math.floor(Math.random() * types.length)];
                this[`create${randomType.charAt(0).toUpperCase() + randomType.slice(1)}Explosion`](particleCount, explosionX, explosionY);
                break;
        }

        // 爆発音の再生
        this.playExplosionSound();
    }

    // 円形の爆発パターン
    createCircleExplosion(particleCount, x, y) {
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = (2 + Math.random() * 3) * this.sizeMultiplier;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            // 色のバリエーションを追加
            const colorVariation = {
                r: this.color.r + Math.floor(Math.random() * 30 - 15),
                g: this.color.g + Math.floor(Math.random() * 30 - 15),
                b: this.color.b + Math.floor(Math.random() * 30 - 15)
            };
            
            this.particles.push(new Particle(
                x,
                y,
                colorVariation,
                velocity,
                0.05,  // 重力
                0.98,  // 摩擦
                0.005 + Math.random() * 0.005,  // フェード率
                (1 + Math.random() * 1.5) * this.sizeMultiplier  // サイズ
            ));
        }
    }

    // 菊型の爆発パターン（レイヤー数を減らして描画負荷を軽減）
    createChrysanthemumExplosion(particleCount, x, y) {
        const layers = 2;
        const particlesPerLayer = Math.floor(particleCount / layers);
        
        for (let layer = 0; layer < layers; layer++) {
            const layerSpeed = (1.5 + layer * 1.5) * this.sizeMultiplier;
            
            for (let i = 0; i < particlesPerLayer; i++) {
                const angle = (i / particlesPerLayer) * Math.PI * 2;
                const speed = layerSpeed + Math.random() * 1;
                const velocity = {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                };
                
                // 色のバリエーションを追加
                const colorVariation = {
                    r: this.color.r + Math.floor(Math.random() * 30 - 15),
                    g: this.color.g + Math.floor(Math.random() * 30 - 15),
                    b: this.color.b + Math.floor(Math.random() * 30 - 15)
                };
                
                this.particles.push(new Particle(
                    x,
                    y,
                    colorVariation,
                    velocity,
                    0.03,  // 重力
                    0.99,  // 摩擦
                    0.004 + Math.random() * 0.003,  // フェード率
                    (1 + Math.random() * 1.5) * this.sizeMultiplier  // サイズ
                ));
            }
        }
    }

    // 柳型の爆発パターン
    createWillowExplosion(particleCount, x, y) {
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = (3 + Math.random() * 2) * this.sizeMultiplier;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            // 色のバリエーションを追加
            const colorVariation = {
                r: this.color.r + Math.floor(Math.random() * 30 - 15),
                g: this.color.g + Math.floor(Math.random() * 30 - 15),
                b: this.color.b + Math.floor(Math.random() * 30 - 15)
            };
            
            this.particles.push(new Particle(
                x,
                y,
                colorVariation,
                velocity,
                0.1,   // 重力（柳は重力が強い）
                0.98,  // 摩擦
                0.003 + Math.random() * 0.002,  // フェード率
                (1 + Math.random() * 1.5) * this.sizeMultiplier,  // サイズ
                true   // 軌跡あり
            ));
        }
    }

    // クロセット型の爆発パターン（分裂する花火）
    createCrossetteExplosion(particleCount, x, y) {
        // まず通常の円形爆発を作成
        const initialParticleCount = Math.floor(particleCount * 0.3);
        this.createCircleExplosion(initialParticleCount, x, y);
        
        // 分裂する親パーティクルを追加
        const parentParticleCount = Math.floor(particleCount * 0.7);
        const parentParticles = [];
        
        for (let i = 0; i < parentParticleCount / 5; i++) {
            const angle = (i / (parentParticleCount / 5)) * Math.PI * 2;
            const speed = (2 + Math.random() * 2) * this.sizeMultiplier;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            // 色のバリエーションを追加
            const colorVariation = {
                r: this.color.r + Math.floor(Math.random() * 30 - 15),
                g: this.color.g + Math.floor(Math.random() * 30 - 15),
                b: this.color.b + Math.floor(Math.random() * 30 - 15)
            };
            
            const parentParticle = new Particle(
                x,
                y,
                colorVariation,
                velocity,
                0.05,  // 重力
                0.98,  // 摩擦
                0.001,  // フェード率（長く残る）
                (2 + Math.random()) * this.sizeMultiplier,  // サイズ
                true   // 軌跡あり
            );
            
            parentParticles.push(parentParticle);
            this.particles.push(parentParticle);
        }
        
        // 一定時間後に親パーティクルを分裂させる
        setTimeout(() => {
            for (const parent of parentParticles) {
                if (parent.alpha > 0.5) {  // まだ生きている場合のみ分裂
                    // 親パーティクルから5つの子パーティクルを生成
                    for (let j = 0; j < 5; j++) {
                        const childAngle = (j / 5) * Math.PI * 2;
                        const childSpeed = 2 * this.sizeMultiplier;
                        const childVelocity = {
                            x: parent.velocity.x * 0.3 + Math.cos(childAngle) * childSpeed,
                            y: parent.velocity.y * 0.3 + Math.sin(childAngle) * childSpeed
                        };
                        
                        this.particles.push(new Particle(
                            parent.x,
                            parent.y,
                            parent.color,
                            childVelocity,
                            0.05,  // 重力
                            0.98,  // 摩擦
                            0.01 + Math.random() * 0.01,  // フェード率
                            parent.size * 0.6,  // サイズ
                            true   // 軌跡あり
                        ));
                    }
                    
                    // 親パーティクルのフェード率を上げて早く消えるようにする
                    parent.fadeRate = 0.1;
                }
            }
        }, 300 + Math.random() * 200);  // 300〜500ms後に分裂
    }

    // リング型の爆発パターン
    createRingExplosion(particleCount, x, y) {
        // 水平方向のリング
        const horizontalRingCount = Math.floor(particleCount * 0.6);
        for (let i = 0; i < horizontalRingCount; i++) {
            const angle = (i / horizontalRingCount) * Math.PI * 2;
            const speed = (3 + Math.random() * 1) * this.sizeMultiplier;
            const velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * 0.3 * speed  // 垂直方向の速度を抑える
            };
            
            // 色のバリエーションを追加
            const colorVariation = {
                r: this.color.r + Math.floor(Math.random() * 30 - 15),
                g: this.color.g + Math.floor(Math.random() * 30 - 15),
                b: this.color.b + Math.floor(Math.random() * 30 - 15)
            };
            
            this.particles.push(new Particle(
                x,
                y,
                colorVariation,
                velocity,
                0.04,  // 重力
                0.99,  // 摩擦
                0.004 + Math.random() * 0.002,  // フェード率
                (1 + Math.random() * 1.5) * this.sizeMultiplier  // サイズ
            ));
        }
        
        // 垂直方向のリング
        const verticalRingCount = Math.floor(particleCount * 0.4);
        for (let i = 0; i < verticalRingCount; i++) {
            const angle = (i / verticalRingCount) * Math.PI * 2;
            const speed = (3 + Math.random() * 1) * this.sizeMultiplier;
            const velocity = {
                x: Math.cos(angle) * 0.3 * speed,  // 水平方向の速度を抑える
                y: Math.sin(angle) * speed
            };
            
            // 色のバリエーションを追加
            const colorVariation = {
                r: this.color.r + Math.floor(Math.random() * 30 - 15),
                g: this.color.g + Math.floor(Math.random() * 30 - 15),
                b: this.color.b + Math.floor(Math.random() * 30 - 15)
            };
            
            this.particles.push(new Particle(
                x,
                y,
                colorVariation,
                velocity,
                0.04,  // 重力
                0.99,  // 摩擦
                0.004 + Math.random() * 0.002,  // フェード率
                (1 + Math.random() * 1.5) * this.sizeMultiplier  // サイズ
            ));
        }
    }

// 爆発音の再生
    playExplosionSound() {
        if (typeof audioContext !== 'undefined') {
            try {
                // 「ドカーン」という迫力ある爆発音
                
                // 1. 低音の「ドン」という音（メインの爆発音）
                const mainOsc = audioContext.createOscillator();
                const mainGain = audioContext.createGain();
                
                // より低い周波数で開始し、ゆっくり減衰させる
                mainOsc.type = 'sine';
                mainOsc.frequency.setValueAtTime(80, audioContext.currentTime);
                mainOsc.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 1.0);
                
                // 音量を大きくして迫力を出す
                mainGain.gain.setValueAtTime(1.0, audioContext.currentTime);
                mainGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
                
                mainOsc.connect(mainGain);
                mainGain.connect(audioContext.destination);
                
                // 2. 「ドカッ」という衝撃音
                const impactOsc = audioContext.createOscillator();
                const impactGain = audioContext.createGain();
                
                impactOsc.type = 'triangle';
                impactOsc.frequency.setValueAtTime(200, audioContext.currentTime);
                impactOsc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
                
                impactGain.gain.setValueAtTime(0.8, audioContext.currentTime);
                impactGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                impactOsc.connect(impactGain);
                impactGain.connect(audioContext.destination);
                
                // 3. ノイズ成分（爆発の「バリバリ」という音）
                const bufferSize = 4096;
                const noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
                const noiseGain = audioContext.createGain();
                
                noiseNode.onaudioprocess = function(e) {
                    const output = e.outputBuffer.getChannelData(0);
                    for (let i = 0; i < bufferSize; i++) {
                        // ホワイトノイズ（バリバリという音）
                        output[i] = Math.random() * 2 - 1;
                    }
                };
                
                // ノイズにフィルターを適用
                const bpFilter = audioContext.createBiquadFilter();
                bpFilter.type = 'bandpass';
                bpFilter.frequency.value = 700;
                bpFilter.Q.value = 1.0;
                
                noiseGain.gain.setValueAtTime(0.7, audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                noiseNode.connect(bpFilter);
                bpFilter.connect(noiseGain);
                noiseGain.connect(audioContext.destination);
                
                // 4. 残響音（「パチパチ」という音）
                setTimeout(() => {
                    const echoNoiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
                    const echoGain = audioContext.createGain();
                    
                    echoNoiseNode.onaudioprocess = function(e) {
                        const output = e.outputBuffer.getChannelData(0);
                        for (let i = 0; i < bufferSize; i++) {
                            // スパース（まばら）なノイズでパチパチ感を出す
                            output[i] = Math.random() > 0.8 ? Math.random() * 2 - 1 : 0;
                        }
                    };
                    
                    echoGain.gain.setValueAtTime(0.3, audioContext.currentTime);
                    echoGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                    
                    echoNoiseNode.connect(echoGain);
                    echoGain.connect(audioContext.destination);
                    
                    // 短い時間で停止
                    setTimeout(() => {
                        echoNoiseNode.disconnect();
                    }, 800);
                }, 200); // 爆発音の少し後に再生
                
                // 音を再生
                mainOsc.start();
                impactOsc.start();
                
                // 音を停止
                mainOsc.stop(audioContext.currentTime + 1.2);
                impactOsc.stop(audioContext.currentTime + 0.3);
                
                // ノイズを停止（タイムアウトで）
                setTimeout(() => {
                    noiseNode.disconnect();
                }, 500);
                
            } catch (e) {
                console.error('爆発音の再生に失敗しました:', e);
            }
        }
    }

    // 花火の更新
    update() {
        if (!this.exploded) {
            this.rocket.update();
            
            // ロケットが目標に到達したら爆発
            if (this.rocket.velocity.y > 0 || 
                Math.abs(this.rocket.y - this.targetY) < 20) {
                this.explode();
            }
        } else {
            // パーティクルの更新
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update();
                if (!this.particles[i].isAlive()) {
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    // 花火の描画
    draw() {
        if (!this.exploded) {
            this.rocket.draw();
        } else {
            for (const particle of this.particles) {
                particle.draw();
            }
        }
    }

    // 花火が生存しているかどうか
    isAlive() {
        return !this.exploded || this.particles.length > 0;
    }
}

// 花火の配列
const fireworks = [];

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    
    // キャンバスをクリア（半透明の黒で塗りつぶして残像効果を作る）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 花火の更新と描画
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].draw();
        
        if (!fireworks[i].isAlive()) {
            fireworks.splice(i, 1);
        }
    }
}

// 花火を打ち上げる関数
function launchFirework(x, y) {
    // 打ち上げ位置（画面下部のランダムな位置）
    const launchX = Math.random() * canvasWidth;
    const launchY = canvasHeight;
    
    // 目標位置（クリックした位置またはランダム）
    const targetX = x || Math.random() * canvasWidth;
    const targetY = y || canvasHeight * 0.2 + Math.random() * canvasHeight * 0.5;
    
    // 花火の種類を取得
    const fireworkType = getSelectedFireworkType();
    
    // 花火の色を取得
    const color = getSelectedColor();
    
    // 花火を作成
    fireworks.push(new Firework(launchX, launchY, targetX, targetY, color, fireworkType));
    
    // 打ち上げ音の再生
    playLaunchSound();
}

// 打ち上げ音の再生
function playLaunchSound() {
    if (typeof audioContext !== 'undefined') {
        try {
            // 「しゅーー」という打ち上げ音
            const bufferSize = 4096;
            const noiseNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
            const gainNode = audioContext.createGain();
            
            noiseNode.onaudioprocess = function(e) {
                const output = e.outputBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
            };
            
            // ハイパスフィルターでシュー音を強調
            const filter = audioContext.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1000;
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            noiseNode.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 一定時間後にノイズを停止
            setTimeout(() => {
                noiseNode.disconnect();
            }, 500);
            
        } catch (e) {
            console.error('打ち上げ音の再生に失敗しました:', e);
        }
    }
}

// プロの職人による花火大会モード
let isFireworkFestivalMode = true; // 常に花火大会モードをオン（変更不可）
let lastLaunchTime = 0;
let launchPattern = [];
let currentPatternIndex = 0;

// 花火大会のパターンを生成
function generateFireworkFestivalPattern() {
    launchPattern = [];
    
    // 基本パターン：画面を5つのエリアに分けて、それぞれのエリアで打ち上げる位置を決定
    const areas = [
        { xMin: 0.1, xMax: 0.3, yMin: 0.1, yMax: 0.3 },
        { xMin: 0.7, xMax: 0.9, yMin: 0.1, yMax: 0.3 },
        { xMin: 0.4, xMax: 0.6, yMin: 0.1, yMax: 0.2 },
        { xMin: 0.2, xMax: 0.4, yMin: 0.2, yMax: 0.4 },
        { xMin: 0.6, xMax: 0.8, yMin: 0.2, yMax: 0.4 }
    ];
    
// 各エリアで複数の花火を打ち上げるパターンを生成（負荷軽減のため数を減らす）
    for (let i = 0; i < 5; i++) {
        const area = areas[i % areas.length];
        const x = (area.xMin + Math.random() * (area.xMax - area.xMin)) * canvasWidth;
        const y = (area.yMin + Math.random() * (area.yMax - area.yMin)) * canvasHeight;
        
        // 花火の種類をバランスよく選択
        const types = ['circle', 'chrysanthemum', 'willow', 'crossette', 'ring'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // 色をバランスよく選択
        const colorIndex = Math.floor(Math.random() * colors.length);
        
        // 打ち上げるタイミングを計算（前の花火から0.5〜1.5秒後、間隔を長くする）
        const timing = (i === 0) ? 0 : launchPattern[i-1].timing + 500 + Math.random() * 1000;
        
        // 花火のサイズ（大きさのバリエーション）
        const size = 0.8 + Math.random() * 0.4;
        
        launchPattern.push({
            x: x,
            y: y,
            type: type,
            colorIndex: colorIndex,
            timing: timing,
            size: size
        });
    }
    
    // フィナーレ：最後に一斉に打ち上げるパターンを追加（負荷軽減のため数を減らす）
    const finaleDelay = launchPattern[launchPattern.length - 1].timing + 3000;
    for (let i = 0; i < 3; i++) {
        const x = 0.1 + Math.random() * 0.8 * canvasWidth;
        const y = 0.1 + Math.random() * 0.3 * canvasHeight;
        const type = ['circle', 'chrysanthemum', 'willow'][Math.floor(Math.random() * 3)];
        const colorIndex = Math.floor(Math.random() * colors.length);
        const timing = finaleDelay + Math.random() * 1000;
        const size = 0.9 + Math.random() * 0.3;
        
        launchPattern.push({
            x: x,
            y: y,
            type: type,
            colorIndex: colorIndex,
            timing: timing,
            size: size
        });
    }
    
    // パターンを時間順にソート
    launchPattern.sort((a, b) => a.timing - b.timing);
}

// プロの職人による花火の打ち上げ
function launchProfessionalFirework(targetX, targetY, fireworkType, color, sizeMultiplier = 1.0) {
    // 打ち上げ位置（画面下部の計算された位置）
    // プロの職人は花火の種類や目標位置に応じて打ち上げ位置を調整する
    const launchX = targetX + (Math.random() * 100 - 50); // 少しランダム性を持たせる
    const launchY = canvasHeight;
    
    // 花火を作成（サイズ倍率を指定）
    fireworks.push(new Firework(launchX, launchY, targetX, targetY, color, fireworkType, sizeMultiplier));
    
    // 打ち上げ音の再生
    playLaunchSound();
}

// 自動的に花火を打ち上げる
function autoLaunchFireworks() {
    const currentTime = Date.now();
    
    if (isFireworkFestivalMode) {
        // 花火大会モード
        if (launchPattern.length === 0 || currentPatternIndex >= launchPattern.length) {
            // パターンが終了したら新しいパターンを生成
            generateFireworkFestivalPattern();
            currentPatternIndex = 0;
            lastLaunchTime = currentTime;
        }
        
        // パターンに従って花火を打ち上げる
        while (currentPatternIndex < launchPattern.length && 
               currentTime - lastLaunchTime >= launchPattern[currentPatternIndex].timing) {
            const pattern = launchPattern[currentPatternIndex];
            launchProfessionalFirework(
                pattern.x, 
                pattern.y, 
                pattern.type, 
                colors[pattern.colorIndex],
                pattern.size
            );
            currentPatternIndex++;
        }
    } else {
        // 通常モード（ランダムに打ち上げる、花火の最大数と間隔を調整して負荷軽減）
        if (fireworks.length < 3 && currentTime - lastLaunchTime > 3000) {
            launchFirework();
            lastLaunchTime = currentTime;
        }
    }
    
    // 次のフレームで再度チェック
    requestAnimationFrame(autoLaunchFireworks);
}

// 選択された花火の種類を取得
function getSelectedFireworkType() {
    const radioButtons = document.getElementsByName('firework-type');
    for (const radioButton of radioButtons) {
        if (radioButton.checked) {
            return radioButton.value;
        }
    }
    return 'random';
}

// 選択された色を取得
function getSelectedColor() {
    const radioButtons = document.getElementsByName('color-option');
    let selectedValue = 'random';
    
    for (const radioButton of radioButtons) {
        if (radioButton.checked) {
            selectedValue = radioButton.value;
            break;
        }
    }
    
    if (selectedValue === 'random') {
        return colors[Math.floor(Math.random() * colors.length)];
    } else if (selectedValue === 'red') {
        return { r: 255, g: 50, b: 50 };
    } else if (selectedValue === 'blue') {
        return { r: 50, g: 50, b: 255 };
    } else if (selectedValue === 'green') {
        return { r: 50, g: 255, b: 50 };
    } else if (selectedValue === 'gold') {
        return { r: 255, g: 215, b: 0 };
    }
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// イベントリスナーの設定
document.getElementById('launch-btn').addEventListener('click', () => {
    // 花火大会モードを維持
    isFireworkFestivalMode = true;
    // ランダムな位置に花火を打ち上げる
    const x = Math.random() * canvasWidth;
    const y = canvasHeight * 0.2 + Math.random() * canvasHeight * 0.3;
    launchProfessionalFirework(
        x, 
        y, 
        getSelectedFireworkType(), 
        getSelectedColor(),
        0.8 + Math.random() * 0.4
    );
});

// アニメーションの開始
animate();
autoLaunchFireworks();

// ページ読み込み時の処理
window.addEventListener('load', () => {
    // 花火大会モードを開始
    isFireworkFestivalMode = true;
    generateFireworkFestivalPattern();
});
