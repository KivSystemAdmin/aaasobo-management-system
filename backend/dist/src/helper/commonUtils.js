"use strict";
// This file contains common functions that are used in multiple controllers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickProperties = void 0;
// Create a new object that contains only the properties specified in the array.
const pickProperties = (dBData, properties, mapping) => {
  const pickedProperties = {};
  properties.forEach((property) => {
    if (dBData.hasOwnProperty(property)) {
      if (!mapping) {
        pickedProperties[property] = dBData[property];
      } else {
        const newPropertyName = mapping[property] || property;
        pickedProperties[newPropertyName] = dBData[property];
      }
    }
  });
  return pickedProperties;
};
exports.pickProperties = pickProperties;
