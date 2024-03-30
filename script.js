"use strict"
const print = console.log

class Drum {
    constructor(DOM_DrumS, elementNumber, cell_number = 6, begin_angle = 0) {
        this.lastSector = 1

        this.DOM_element = DOM_DrumS[elementNumber]
        this.elementNumber = elementNumber
        this.cell_number = cell_number

        this.angle = begin_angle
        this.accelerator = 0
        this.accelerator_1 = 0.3
        this.accelerator_2 = -0.09 + 0.01 * this.elementNumber
        this.maxSpeed = 12
        this.speed = 0
        this.flagMaxSpeedReached = false
        this.stablePosition = true

    }

    rotate() {
        this.stablePosition = false
        const randomValue = Math.random()
        // print(randomValue)
        let newMaxSpeed = this.maxSpeed * (1 + 0.3 * randomValue)
        return new Promise((res, rej) => {
            const interval = setInterval(() => {
                this.accelerator =
                    this.flagMaxSpeedReached ?
                        this.accelerator_2 : this.accelerator_1

                this.speed += this.accelerator
                this.angle += this.speed
                if (this.speed >= newMaxSpeed) {
                    this.flagMaxSpeedReached = true
                    // print(newMaxSpeed)
                }
                if (this.speed < 0) {
                    this.speed = 0
                    // this.angle = Math.round(this.angle % 360)
                }
                this.DOM_element.style.transform = 'rotateX(' + this.angle + 'deg)'

                if (this.speed === 0 &&
                    this.flagMaxSpeedReached === true) {
                    this.flagMaxSpeedReached = false
                    clearInterval(interval)
                    this.fixed(res)
                }
            }, 10)
        })

    }
    fixed(resolve) {
        const angleStep = 360 / this.cell_number
        // print(angleStep)
        // print(this.angle)

        let sector = Math.round((this.angle % 360) / angleStep)
        if (sector === 6) sector = 0 //проблема с этим моментоМ!!!!
        // print("drump: " + this.elementNumber, "sector: " + sector)
        /**
         * xa - положение точки А 
         * x0 - координата середины сектора
         * не забывать о смещении 30 градусов. Важно для момента перехода сектора 5-0!!!
         */
        const X0 = Math.floor((this.angle + 30) / 360) *360  + (sector * angleStep)
        // print(sector)
        // print(X0)
        const XA = Math.round(this.angle) 
        // print(XA)
        const dx = X0 - XA
        // print("dx = " + dx)

        const interval = setInterval(() => {
            this.angle +=  0.011 * dx

            if(dx ===0){
                this.angle = X0
                this.stablePosition = true
            }
            if (dx > 0 && this.angle >= X0) {
                this.angle = X0
                this.stablePosition = true
            }
            if (dx < 0 && this.angle <= X0) {
                this.angle = X0
                this.stablePosition = true
            }

            this.DOM_element.style.transform = 'rotateX(' + this.angle + 'deg)'

            if (this.stablePosition === true) {
                this.lastSector = sector
                resolve({
                    drum_number: this.elementNumber,
                    sector: this.lastSector,
                    drumObject: this,
                })
                clearInterval(interval)
            }
        }, 10)
    }
}

const DOM_DrumS = document.querySelectorAll(".drum")

// const drum_1 = new Drum(DOM_DrumS, 0)
// drum_1.rotate().then(res => print(res))
// const drum_2 = new Drum(DOM_DrumS, 1)
// drum_2.rotate().then(res => print(res))
// const drum_3 = new Drum(DOM_DrumS, 2)
// drum_3.rotate().then(res => print(res))

const admin = {
    drum_delay: 80,
    drums: [
        //барабаны должны быть упорядочены слева направо!
        new Drum(DOM_DrumS, 0),
        new Drum(DOM_DrumS, 1),
        new Drum(DOM_DrumS, 2)
    ],
    conboModifacators: [
        // [0, 3], [3, 0],
        // [1, 4], [4, 1],
        // [2, 5], [5, 2],
    ],

    drumsRotate: function (cb = () => { }) {
        this.clearCell()

        if (this.run === true) return
        this.run = true
        this.register = []
        return new Promise(resaltOne => {
            // const drum_resalt = {}  //numberDrum : numberSector
            this.drums.forEach((item, index) => {
                setTimeout(() => {
                    item.rotate().then(res => {
                        print(res)
                        // drum_resalt[item.elementNumber] = res.sector
                        // print(drum_resalt)
                        this.register.push(res.drumObject)
                        if (this.register.length === this.drums.length) {
                            resaltOne()
                            this.run = false
                            this.register = []
                            cb(this.drums)
                            this.postRotateProcess()
                        }
                    })
                }, index * this.drum_delay)
            })

        })
    },

    isCombo: function () {

        const comboObjects = []
        // const drum_values = this.drums.map(item => item.lastSector)
        this.drums.forEach(item => {
            if (comboObjects.length === 0) {
                comboObjects.push([item])
                return
            }

            let currentComboNumbers = (() => {
                const array = []
                array.push(comboObjects[comboObjects.length - 1][0].lastSector)
                this.conboModifacators.forEach(i => {
                    if (i[0] === array[0]) array.push(i[1])
                })

                return array
            })()

            let resetCombo = true
            currentComboNumbers.forEach(i => {
                if (i === item.lastSector) resetCombo = false
            })

            if (resetCombo === false) {
                comboObjects[comboObjects.length - 1].push(item)
            } else {
                comboObjects.push([item])
            }

        })
        print(comboObjects)

        const maxCombo = (() => {
            let MaxNumber = 0
            comboObjects.forEach(item => {
                if (item.length > MaxNumber) MaxNumber = item.length
            })
            return MaxNumber
        })()

        return {
            comboObjects: comboObjects,
            maxValueCombo: maxCombo
        }
    },
    getArraysByMaxCombo: function (comboArrays, maxComboValue) {
        const array = []
        comboArrays.forEach(item => {
            if (item.length === maxComboValue) array.push(item)
        })
        return array
    },

    postRotateProcess: function () {
        const comboData = admin.isCombo()
        let arraysByMaxCombo = this.getArraysByMaxCombo(comboData.comboObjects, comboData.maxValueCombo)

        if (comboData.maxValueCombo > 1) {
            arraysByMaxCombo[0].forEach(item => {
                // print(item)
                const cell = item.DOM_element.querySelector(`.cell[number="${item.lastSector}"]`)
                // print(cell)
                cell.classList.add("selected")

                sound.startSound(end_sound)
                setTimeout(() => {
                    if (comboData.maxValueCombo > 2) {
                        sound.startSound(mega_win_sound)
                    } else { 
                        sound.startSound(small_win_sound)

                    }
                }
                    , 500)
            })
        } else {
            setTimeout(() => sound.startSound(error_sound), 500)
        }
    },
    clearCell() {
        const cells = document.querySelectorAll(".drumS .cell.selected")
        // print(cells)
        for (let cell of cells) {
            cell.classList.remove("selected")
        }
    },
}



const sound = {
    addSoundTrackInHTML: (function () {
        document.body.insertAdjacentHTML("beforeend", `<audio id="error_sound" src="./source/sound/error.mp3"></audio>`)
        document.body.insertAdjacentHTML("beforeend", `<audio id="press_sound" src="./source/sound/press_button.mp3"></audio>`)
        document.body.insertAdjacentHTML("beforeend", `<audio id="rotate_sound" src="./source/sound/rotate.mp3"></audio>`)
        document.body.insertAdjacentHTML("beforeend", `<audio id="win_sound" src="./source/sound/win.mp3"></audio>`)
        document.body.insertAdjacentHTML("beforeend", `<audio id="mega_win_sound" src="./source/sound/mega_win.mp3"></audio>`)
        document.body.insertAdjacentHTML("beforeend", `<audio id="small_win_sound" src="./source/sound/small_win.mp3"></audio>`)
        document.body.insertAdjacentHTML("beforeend", `<audio id="end_sound" src="./source/sound/end.mp3"></audio>`)
        print("sound added")
    })(),
    startSound: function (soundElement) {
        soundElement.volume = 0.9;
        soundElement.muted = false;
        soundElement.play()
    },
    stopSound: function (soundElement) {
        soundElement.pause()
    },
}

// const bgcPlayer = document.getElementById('bg_sound');
// bgcPlayer.volume = 0.15;
// bgcPlayer.muted = true;
// bgcPlayer.muted = false;
// bgcPlayer.play()
// bgcPlayer.loop = true;



// admin.drumsRotate((drums) => {

// })

document.addEventListener("click", () => {
    admin.drumsRotate()
    sound.startSound(press_sound)
    sound.startSound(rotate_sound)
})



