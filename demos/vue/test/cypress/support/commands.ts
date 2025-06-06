/* eslint-disable n/file-extension-in-import */
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
import '@4tw/cypress-drag-drop';
import 'cypress-real-events';

import { convertPosition } from './common';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      // triggerHover: (elements: NodeListOf<HTMLElement>) => void;
      convertPosition(viewport: string): Chainable<HTMLElement | JQuery<HTMLElement> | { x: string; y: string }>;
      getCell(
        row: number,
        col: number,
        viewport?: string,
        options?: { parentSelector?: string; rowHeight?: number }
      ): Chainable<HTMLElement | JQuery<HTMLElement>>;
      getNthCell(
        row: number,
        nthCol: number,
        viewport?: string,
        options?: { parentSelector?: string; rowHeight?: number }
      ): Chainable<HTMLElement | JQuery<HTMLElement>>;
      saveLocalStorage: () => void;
      restoreLocalStorage: () => void;
    }
  }
}

// convert position like 'topLeft' to the object { x: 'left|right', y: 'top|bottom' }
Cypress.Commands.add('convertPosition', (viewport = 'topLeft') => cy.wrap(convertPosition(viewport)));

Cypress.Commands.add('getCell', (row, col, viewport = 'topLeft', { parentSelector = '', rowHeight = 35 } = {}) => {
  const position = convertPosition(viewport);
  const canvasSelectorX = position.x ? `.grid-canvas-${position.x}` : '';
  const canvasSelectorY = position.y ? `.grid-canvas-${position.y}` : '';

  return cy.get(
    `${parentSelector} ${canvasSelectorX}${canvasSelectorY} [style="transform: translateY(${row * rowHeight}px);"] > .slick-cell.l${col}.r${col}`
  );
});

Cypress.Commands.add('getNthCell', (row, nthCol, viewport = 'topLeft', { parentSelector = '', rowHeight = 35 } = {}) => {
  const position = convertPosition(viewport);
  const canvasSelectorX = position.x ? `.grid-canvas-${position.x}` : '';
  const canvasSelectorY = position.y ? `.grid-canvas-${position.y}` : '';

  return cy.get(
    `${parentSelector} ${canvasSelectorX}${canvasSelectorY} [style="transform: translateY(${row * rowHeight}px);"] > .slick-cell:nth(${nthCol})`
  );
});
const LOCAL_STORAGE_MEMORY: any = {};

Cypress.Commands.add('saveLocalStorage', () => {
  Object.keys(localStorage).forEach((key) => {
    LOCAL_STORAGE_MEMORY[key] = localStorage[key];
  });
});

Cypress.Commands.add('restoreLocalStorage', () => {
  Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
  });
});
