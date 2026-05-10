import * as vscode from 'vscode';

const OUTPUT_CHANNEL_NAME = 'Nestica';

let outputChannel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
    }

    return outputChannel;
}

export function logToOutput(message: string): void {
    getOutputChannel().appendLine(message);
}

export function showOutputChannel(preserveFocus = false): void {
    getOutputChannel().show(preserveFocus);
}
