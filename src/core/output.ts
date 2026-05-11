import * as vscode from 'vscode';

const OUTPUT_CHANNEL_NAME = 'Nestica';

let outputChannel: vscode.LogOutputChannel | undefined;

export function getOutputChannel(): vscode.LogOutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME, {log: true});
    }

    return outputChannel;
}

export function log(message: string, ...args: any[]): void {
    outputChannel?.info(message, ...args);
}

export function error(message: string, ...args: any[]): void {
    outputChannel?.error(message, ...args);
}

export function debug(message: string, ...args: any[]): void {
    outputChannel?.debug(message, ...args);
}

export function warn(message: string, ...args: any[]): void {
    outputChannel?.warn(message, ...args);
}

export function showOutputChannel(preserveFocus = false): void {
    getOutputChannel().show(preserveFocus);
}

export const output = {
    log,
    error,
    debug,
    warn,
    show: showOutputChannel,
}