# Rainbow Brackets

Rainbow Brackets is a Visual Studio Code extension that colors nested bracket pairs for better readability.

Supported bracket types:

- `()`
- `{}`
- `[]`

## Features

- Colors both opening and closing brackets by nesting depth
- Works in any language where these bracket characters are present
- Live updates while typing

## Development Setup

1. Install dependencies:

	```bash
	npm install
	```

2. Build extension sources:

	```bash
	npm run build
	```

3. Open this project in VS Code and press `F5` to start the Extension Development Host.

## Usage

Rainbow Brackets runs automatically after activation. You can also manually refresh bracket decorations with:

- `Rainbow Brackets: Refresh` command from the Command Palette.

You can customize colors in your VS Code settings:

```json
{
	"rainbowBrackets.colors": [
		"#FF6B6B",
		"#FFD166",
		"#06D6A0",
		"#4CC9F0",
		"#4895EF",
		"#B5179E"
	],
	"rainbowBrackets.guides.enabled": true,
	"rainbowBrackets.guides.thickness": 1,
	"rainbowBrackets.guides.opacity": 1
}
```

## Contributing

Contributions are welcome. Feel free to submit a pull request or open an issue.