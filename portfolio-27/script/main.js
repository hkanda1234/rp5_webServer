import { tagRenderer } from "./tagRenderer.js";
import { statementAnimation} from "./statementAnimation.js";
import { overlayManager } from "./overlayManager.js";
import { loadingScreen } from "./loadingScreen.js";
//for tag-render elements
tagRenderer.render();
//define rythm of statement animation
statementAnimation.animStart([0, 0.2, 0.5, 0.5, 0.2, 0.7]);

overlayManager.start();