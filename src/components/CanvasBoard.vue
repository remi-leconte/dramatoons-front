<template>
  <section id="canvas">
    <div id="canvas-explication">
      <!------------------------------Case 1------------------------------------>
      <div class="case case-1">
        <img src="../assets/board/liste.png" alt="Liste" class="img" />
      </div>

      <div class="case case-1-perso-1">
        <img src="../assets/board/case1-perso1.png" alt="Si je ne peux pas lire de Webtoons sur ce site, à quoi sert-il ?" class="img" />
      </div>
      <div class="case case-1-perso-1-text">
        <p>Si je ne peux<br>pas lire de Webtoons sur ce site, à quoi<br>sert-il ?</p>
      </div>

      <!------------------------------Case 2------------------------------------>
      <div class="case case-2">
        <img src="../assets/board/liste_detail.png" alt="Liste 3" class="img case-2-img" />
      </div>

      <div class="case case-2-perso-1">
        <img src="../assets/board/case2-perso1.png" alt="Dramatoons te permet de suivre la lecture de tes Webtoons préférés." class="img" />
      </div>

      <div class="case case-2-perso-1-text">
        <p>Dramatoons<br>te permet de suivre<br>la lecture de tes Webtoons préférés.</p>
      </div>

      <!------------------------------Case 3------------------------------------>
      <div class="case case-3">
        <img src="../assets/board/extension_1.png" alt="Liste" class="img" style="position: relative;top: -116px;">
      </div>

      <div class="case case-3-perso-1">
        <img src="../assets/board/case3-perso1.png" alt="Ensuite, télécharge l'extension 'Dramatoons Highlighter' sur ton navigateur." class="img" />
      </div>

      <div class="case case-3-perso-1-text">

        <p>Ensuite, télécharge l'extension <router-link to="/install-tutorial">Dramatoons Highlighter</router-link> sur ton navigateur.</p>
        <!--<a href="https://addons.mozilla.org/fr/firefox/addon/dramatoons-highlighter/" target="_blank">Dramatoons Highlighter</a>-->
      </div>

      <!------------------------------Case 4------------------------------------>
      <div class="case case-4">
        <img src="../assets/board/extension_site_1.png" alt="Liste 3" class="img" style="position: relative;top: -25px;" />
      </div>

      <div class="case case-4-perso-1">
        <img src="../assets/board/case4-perso1.png" alt="Avec cette extension je peux voir où j'en suis dans mes lectures !" class="img" />
      </div>

      <div class="case case-4-perso-1-text">
        <p>Avec cette<br>extension, je peux voir où j'en suis dans mes lectures !</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap');

#canvas {
  text-align: center;
  overflow: hidden;
  background-color: #fff;
  width: 697px;
  margin: 0 auto;
  font-family: 'Patrick Hand', 'Comic Sans MS', cursive;
}

#canvas-explication {
  position: relative;
  width: 100%;
  max-width: 697px;
  height: 1655px;
}

/* Global */
#canvas-explication .case {
  position: absolute;
  z-index: 2;
  color: #000;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

#canvas-explication p {
  transform: scaleX(1.1);
  font-size: 15.0px;
  line-height: 1.1;
  color: #000;
}

/* Spécifique case 1 */
#canvas-explication .case-1 {
  left: 4%;
  top: 47px;
  width: 639px;
  height: 309px;
  border: 2px solid #000;
}

.case.case-1 .img {
  opacity: 0.7;
  object-fit: cover;
}

#canvas-explication .case-1-perso-1 {
  left: 8%;
  top: 4px;
  height: 354px;
}

#canvas-explication .case-1-perso-1-text {
  left: 23.8%;
  top: 9px;
  width: 117px;
}

#canvas-explication .case-1-perso-2 {
  left: 55%;
  top: 51px;
  height: 307px;
}

/* Spécifique case 2 */
#canvas-explication .case-2 {
  left: 4%;
  top: 374px;
  width: 639px;
  height: 399px;
  border: 2px solid #000;
  overflow: hidden;
}

.case-2-img {
  position: relative;
  left: -231px;
  top: -297px;
  width: 1280px;
  height: 882px;
  object-fit: cover;
}

#canvas-explication .case-2-perso-1 {
  left: 38%;
  top: 370px;
  height: 405px;
}

#canvas-explication .case-2-perso-1-text {
  left: 42%;
  top: 373px;
  width: 128px;
}

#canvas-explication .case-2-perso-2 {
  left: 52%;
  top: 447px;
  width: 307px;
  height: 328px;
}

/* Spécifique case 3 */
#canvas-explication .case-3 {
  left: 4%;
  top: 807px;
  width: 639px;
  height: 399px;
  border: 2px solid #000;
  overflow: hidden;
}

#canvas-explication .case-3-perso-1-text {
  left: 33.6%;
  top: 804px;
  width: 143px;
}

#canvas-explication .case-3-perso-1 {
  left: 32%;
  top: 794px;
  height: 414px;
}

/* Spécifique case 4 */
#canvas-explication .case-4 {
  left: 4%;
  top: 1224px;
  width: 639px;
  height: 399px;
  border: 2px solid #000;
  overflow: hidden;
}

#canvas-explication .case-4-img-1 {
  left: 8%;
  top: 1233px;
  width: 180px;
  height: 328px;
}

#canvas-explication .case-4-img-2 {
  left: 67%;
  top: 1233px;
  width: 180px;
  height: 328px;
}

#canvas-explication .case-4-perso-1-text {
  left: 5.7%;
  top: 1279px;
  width: 115px;
}

#canvas-explication .case-4-perso-1 {
  left: 3%;
  top: 1279px;
  height: 346px;
}

/* Responsive */
@media (max-width: 768px) and (min-width: 420px) {
  #canvas {
    background-color: #000;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0 10px;
  }

  #canvas-explication {
    background-color: #fff;
    zoom: 0.55;
    margin: 0 auto;
  }
}

@media (max-width: 419px) {
  #canvas {
    width: 420px;
    box-sizing: border-box;
    padding: 0 10px;
  }

  #canvas-explication {
    zoom: 0.55;
    margin: 0 auto;
  }
}
</style>