// @ts-nocheck
import React, { forwardRef } from 'react';
import { Button, ButtonProps } from 'react-bootstrap';

const TCButton = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    return (
        <Button ref={ref} {...props}>
            {props.children}
        </Button>
    );
});

export default TCButton;