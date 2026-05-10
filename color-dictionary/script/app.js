import * as e from './engine.js';

const colorpickerDivideLevel = 4;


const canvas = document.querySelector('#colorPickerCanvas')
const colorPickerCanvas = new e.GLCanvas(canvas);

colorPickerCanvas.scene = new e.Scene();

console.log(colorPickerCanvas);

class ColorPicker {
    constructor(){
        this.color = {
            min : null,
            max : null,
        }
    }
}