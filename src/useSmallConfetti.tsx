import confetti from 'canvas-confetti'
import React, { useRef, useState } from 'react';


export default function useConfetti(input_x:number, input_y:number) {
    const handleNormalConfetti = () => {
        confetti({
            startVelocity: 15,
            spread: 70,
            ticks: 50,
            origin: {
                x: input_x,
                y: input_y
            },
        });
    };

    return {
        handleNormalConfetti
    };
};