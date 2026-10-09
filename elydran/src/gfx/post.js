// Pós-processamento do 3D: brilho (bloom) suave e acabamento de cor. Se algo falhar, o jogo roda sem isso.
import * as THREE from './three.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function makePost(renderer, scene, camera) {
  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.5, 1.25);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.bloom = bloom;
  return composer;
}
