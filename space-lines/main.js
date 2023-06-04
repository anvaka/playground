import './style.css'
import createHud from './src/createHud';
import createScene from './src/createScene.js';
import sharedState from './src/sharedState';

let currentScene = null;
createScene(document.querySelector('#scene')).then(scene => {
  createHud(document.body, scene.viewMatrix);
  currentScene = scene;
}).catch(err => {
  document.body.innerHTML = `<div class='error'>
  <div>Could not initialize WebGPU scene. </div>
  <pre>${err}</pre>
  </div>`;
});

const editorPanel = document.querySelector('.field-editor-panel');
const editorContainer = document.querySelector('.field-editor');
const showEditor = document.querySelector('.open-editor');

import('monaco-editor').then(monaco => {
  editorPanel.classList.remove('hidden');
  var editor = monaco.editor.create(editorContainer, {
    value: sharedState.field,
    language: "wgsl",
    minimap: {
      enabled: false
    },
    roundedSelection: true,
    scrollBeyondLastLine: false,
    readOnly: false,
    theme: "vs-dark",
  });

  editorPanel.classList.add('hidden');
  // make sure we add .focused class when editor gets the focus:
  editor.onDidFocusEditorText(() => {
    editorContainer.classList.add('focused');
  });
  editor.onDidBlurEditorText(() => {
    editorContainer.classList.remove('focused');
  });

  editorPanel.querySelector('button.save').addEventListener('click', (e) => {
    let field = editor.getValue();

    currentScene?.updateField(field);
    sharedState.field = field;
  });

  editorPanel.querySelector('button.close').addEventListener('click', (e) => {
    editorPanel.classList.add('hidden');
    showEditor.classList.remove('hidden');
  });
});

showEditor.addEventListener('click', (e) => {
  editorPanel.classList.remove('hidden');
  showEditor.classList.add('hidden');
});