'use client';

import React, { useState, useEffect } from 'react';

interface CreditsOverlayProps {
    onClose: () => void;
}

export default function CreditsOverlay({ onClose }: CreditsOverlayProps) {
    const [viewSource, setViewSource] = useState(false);
    const [sourceCode, setSourceCode] = useState<string>('Loading source...');

    useEffect(() => {
        if (viewSource && sourceCode === 'Loading source...') {
            fetch('blackbox.bas')
                .then(res => res.text())
                .then(text => setSourceCode(text))
                .catch(err => setSourceCode('Error loading source: ' + err.message));
        }
    }, [viewSource, sourceCode]);

    return (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col p-8 overflow-hidden backdrop-blur-sm">
            <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                    <h2 className="text-4xl font-black text-gray-200 tracking-tighter uppercase italic">Credits & Origin</h2>
                    <button 
                        onClick={onClose}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold transition-colors border border-gray-600"
                    >
                        CLOSE
                    </button>
                </div>

                {!viewSource ? (
                    <div className="flex-1 overflow-y-auto space-y-12 pr-4 custom-scrollbar">
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-4">Original Game</h3>
                            <div className="space-y-2">
                                <p className="text-2xl text-gray-300 font-serif">Original concept by <span className="text-white font-bold">Eric Solomon</span> (1977).</p>
                                <p className="text-lg text-gray-400">Popularized in <span className="text-gray-200">BASIC Computer Games</span>, edited by David H. Ahl.</p>
                                <p className="text-md text-gray-500 pt-2 italic">
                                    Original BASIC source code included for historical reference.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-4">Modern Web Implementation (2026)</h3>
                            <div className="space-y-4">
                                <p className="text-xl text-gray-300">Developed by <span className="text-white font-bold text-2xl">Chris Shabsin</span>.</p>
                                <p className="text-lg text-gray-400">Built using <span className="text-blue-400">Next.js 15</span>, <span className="text-blue-400">TypeScript</span>, and <span className="text-blue-400">Tailwind CSS</span>.</p>
                                <p className="text-md text-gray-500 italic">Project initiated and developed as a collaborative engineering experiment with Gemini CLI.</p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mb-4">Game Mechanics</h3>
                            <ul className="list-disc list-inside text-gray-300 space-y-2">
                                <li><span className="font-bold text-white">Ray Tracing:</span> Logic simulates rays entering the box and interacting with hidden atoms.</li>
                                <li><span className="font-bold text-white">Scoring:</span> Follows the classic scoring rules (1 point for entry/exit, 1 for reflection/absorption, 5 for wrong guess).</li>
                            </ul>
                        </section>

                        <div className="pt-8 flex gap-4">
                            <button 
                                onClick={() => setViewSource(true)}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded font-black tracking-widest transition-all shadow-[0_0_15px_rgba(75,85,99,0.5)]"
                            >
                                VIEW ORIGINAL SOURCE CODE
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest font-mono">blackbox.bas</h3>
                            <button onClick={() => setViewSource(false)} className="text-blue-400 text-xs hover:underline">← BACK TO CREDITS</button>
                        </div>
                        <div className="flex-1 bg-black/50 border border-gray-800 rounded p-4 overflow-y-auto font-mono text-[10px] text-green-500/80 custom-scrollbar whitespace-pre">
                            {sourceCode}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
