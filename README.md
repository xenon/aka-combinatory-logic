# aka-combinatory-logic
Combinatory logic interpreter written in Typescript.
Allows dynamic definition of new combinators!

`npm install aka-combinatory-logic`

## Features
- Ability to define more combinators in the evaluation environment
- Convert string representing a CL-term to a CL-expression
- Print CL expressions back into strings
- Perform reduction steps on expressions which can be reduced
- Check for a reduction

## Limitations
- Doesn't support spaces when reading a string into a CL-term
- Thus all combinators and variables are only one letter each!

## TODO
- Make it so that it can support computations with side-effects?
