# Rainbow Brackets

Rainbow Brackets is a Visual Studio Code extension that colors nested bracket pairs for better readability.

- Supported bracket types: `()`, `{}`, `[]`, `<>`
- Supported file types: Any files with these brackets (e.g. JavaScript, Python, C++, etc.)
- Customizable colors and guide lines

## Features

- Colors both opening and closing brackets by nesting depth
- Works in any language where these bracket characters are present
- Live updates while typing

## Development Setup

1. Install dependencies:

	```bash
	npm install @olton/rainbow
	```

2. Build extension sources:

	```bash
	npm run build
	```

3. Open this project in VS Code and press `F5` to start the Extension Development Host.

## Usage

Rainbow runs automatically after activation. You can also manually refresh bracket decorations with:

- `Rainbow: Refresh` command from the Command Palette.

You can customize colors in your VS Code settings:

```json
{
	"rainbow.brackets.enabled": true,
	"rainbow.colors": [
		"#FF6B6B",
		"#FFD166",
		"#06D6A0",
		"#4CC9F0",
		"#4895EF",
		"#B5179E"
	],
	"rainbow.guides.enabled": true,
	"rainbow.guides.thickness": 1,
	"rainbow.guides.opacity": 1
}
```

## Contributing

Contributions are welcome. Feel free to submit a pull request or open an issue.

## Support

If you like this project, please consider supporting it by:

+ Star this repository on GitHub
+ Sponsor this project on GitHub Sponsors
+ **PayPal** to `serhii@pimenov.com.ua`.
+ [**Patreon**](https://www.patreon.com/metroui)
+ [**Buy me a coffee**](https://buymeacoffee.com/pimenov)

---

Copyright (c) 2026 by [Serhii Pimenov](https://pimenov.com.ua). All Rights Reserved.