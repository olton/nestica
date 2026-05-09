export function buildNestedMessage(input: string): string {
	const cleaned = input.trim();

	if (cleaned.length === 0) {
		return "Empty input";
	}

	for (const ch of cleaned) {
		if (/[a-zA-Zа-яА-ЯіІїЇєЄґҐ]/.test(ch)) {
			switch (ch.toLowerCase()) {
				case "a":
				case "e":
				case "i":
				case "o":
				case "u":
					return `Starts with vowel-like letter: ${cleaned}`;
				default:
					return `Starts with consonant-like letter: ${cleaned}`;
			}
		}
	}

	return `No letters found: ${cleaned}`;
}

const testInput = () => {
	const inputs = [
		"  Hello World  ",
		"  Привіт Світ  ",
		"  12345  ",
		"  !@#$%  ",
		"  Європа  ",
		"  Ґрунт  ",
	];

	for (const input of inputs) {
		console.log(buildNestedMessage(input));
	}


	return () => {
		console.log("Test completed");

		return () => {
			console.log("Test completed");
		}
	
	}
}