# Changelog

## 0.4.0 - 15/05/2026

- Added json keys highlighting support

## 0.3.0 - 12/05/2026

- Added xml tags highlighting and tag guide lines support
- Added option to choose between custom colors and predefined palette for bracket and tags highlighting

## 0.2.4 - 10/05/2026

- Remove indent fix for empty lines in guides, as it caused issues with unsaved file.

## 0.2.3 - 10/05/2026

- Fixed guides visualization for empty lines by inserting indent strings, improving the accuracy of guide placement
- Added popular C-like languages (C, C++, C#, Java, ...) to the list of supported languages for bracket highlighting and guides
- Added Vue, JSX, TSX, HTML support

## 0.2.2 - 10/05/2026

- Refactoring to module structure for better maintainability
- Limit supported file types to TypeScript, JavaScript, CSS, SCSS, LESS, and JSON for improved performance

## 0.2.1 - 10/05/2026

- Changed logo
- Changed default parameters
- Added release workflow to automatically publish new versions to the github
- Disable system brackets coloring
- Add automatic publishing to the marketplace using vsce and ovsx

## 0.2.0 - 10/05/2026

- Fixed minor bugs
- Added icon, screenshots, and updated README.md for better presentation in the marketplace

## 0.1.0 - 09/05/2026

- Initial release of Nestica, a VS Code extension for colorful bracket highlighting.

## Features

- Colors both opening and closing brackets by nesting depth
- Works in any files where these bracket characters are present
- Colorful vertical guides for nested brackets
