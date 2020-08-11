/* Combinator Expression:
    - Variable / Atomic Constant
    - (X1...Xn) where X1...Xn are combinator expressions, N>=1
*/

/* Atomic Constants
    Functions defined on 2 properties
    - Arity
    - Argument order

    We can store I,K,S as dynamic functions where
    they specify number of arguments and themselves
    evaluate to a new CL-term which has placeholders for arguments

    Pseudo syntax examples:
        I(1) -> 0
        K(2) -> 0
        S(3) -> 0 2 (1 2)
        ... more combinators
*/

/* CLTerm = atom/var | Array of atoms/vars */
type CLTerm = string | CLTerm[];

/* CLCombination = arg number | Array of arg numbers */       
type CLCombination = number | CLCombination[];

/* Combinator = Arity and CLSubstitution */
type Combinator = [number, CLCombination[]];

/* Here are the 'pure' combinators */
const I: Combinator = [1, [0]]; // Ix -> x
const K: Combinator = [2, [0]]; // Kxy -> x
const S: Combinator = [3, [0, 2, [1, 2]]]; // Sxyz -> xz(yz)

const combinators : Map<string, Combinator> = new Map([
    ["I", I],
    ["K", K],
    ["S", S],
]);

function termToString(e: CLTerm): string {
    function helpParens(e: CLTerm, outerGrouping: boolean) : string {
        if (isNull(e)) {
            return "";
        }
        else if (isAtomOrVar(e)) {
            return (e as string);
        }
        else {
            let res = "";
            if (outerGrouping === true) {
                res += "(";
            }

            for (let i = 0; i < e.length; ++i) {
                res += helpParens(e[i], true); 
            }

            if (outerGrouping === true) {
                res += ")";
            }
            return res;
        }
    }
    return helpParens(e, false);
}

function stringToTerm(s: string) {
    function helpNest(s: string, ind: number): [CLTerm, number] {
        let res = [];
        for(let i = ind; i < s.length; ++i) {
            if (s[i] === '(') {
                let recur = helpNest(s, i+1);
                res.push(recur[0]);
                i = recur[1];
            } else if (s[i] === ')') {
                if (res.length === 1) {
                    return [res[0], i];
                } else {
                    return [res, i];
                }
            } else {
                res.push(s[i]);
            }
        }
        
        if (res.length === 1) {
            return [res[0], s.length];
        } else {
            return [res, s.length];
        }
    }
    return helpNest(s, 0)[0];
}

function isAtomOrVar(e: CLTerm): boolean {
    return (typeof e === "string");
}

function isNull(e: CLTerm): boolean {
    return (e.length == 0);
}

function isArg(e: CLCombination): boolean {
    return (typeof e === "number");
}

function hasWeakRedex(e : CLTerm) : boolean {
    // Base cases
    if (isAtomOrVar(e) || isNull(e)) {
        // cases like: "K" or "s"
        return false;
    }

    const [car, ...cdr] = e;

    if (isAtomOrVar(car)) {
        // cases like ["var/atom", ...];
        let res = combinators.get(car as string); // cast verified by AtomOrVar(car)
        if (res !== undefined) {
            // the first thing is a combinator
            let arity = res[0];
            if (e.length - 1 >= arity) {
               // we can apply the combinator
                return true;
            }
        }
        // we can't apply the combinator or it is a variable, check the rest
        return hasWeakRedex(cdr);
    } else {
        // if the first array is nested, we spread it
        return hasWeakRedex([...car, ...cdr]);
    }
}

function combine(cbnt: CLCombination[], args: CLTerm): CLTerm[] {
    let term = [...cbnt] as CLTerm[]; // lots of type juggling because we convert CLCombination[] -> CLTerm[]
    for (let i = 0; i < term.length; ++i) {
        if (isArg(cbnt[i])) {
            if (i !== 0) {
                term[i] = args[cbnt[i] as number];
            }
        } else { // it is an array
            term[i] = combine(term[i] as CLCombination[], args);
        }
    }

    // remove extra parens on 1st substituted element
    const [car, ...cdr] = term;
    if (isArg(cbnt[0])) {
        // this is the case where we need to remove parens
        if (!isAtomOrVar(args[cbnt[0] as number])) { // cast verified by isArg(cbnt[0])
            return [...args[cbnt[0] as number], ...cdr]; // cast verified by isArg(cbnt[0])
        } else {
            return [args[cbnt[0] as number], ...cdr]; // cast verified by isArg(cbnt[0])
        }
    }
    return [...car, ...cdr];
}

function doWeakReduction(e: CLTerm): CLTerm {
    // assume hasWeakRedex(e) === true
    const [car, ...cdr] = e;
    if (isAtomOrVar(car)) {
        let res = combinators.get(car as string); // cast verified by AtomOrVar(car)
        if (res !== undefined) {
            let arity = res[0];
            if (e.length - 1 >= arity) {
                return [...combine(res[1], cdr), ...cdr.slice(res[0])];
            }
        }
        // arity too high... do something to the rest
        return [car, ...doWeakReduction(cdr)];
    } else {
        // recursive 'deep' search in car and cdr
        return doWeakReduction([...car, ...cdr]);
    }
}

function reduceToNormalForm(e: CLTerm): CLTerm {
    console.log(termToString(e));
    if (isAtomOrVar(e)) {
        return e;
    }
    let e2: CLTerm = [...e];
    for (let i = 0; hasWeakRedex(e2); ++i) {
        e2 = doWeakReduction(e2);
        console.log(termToString(e2));
    }
    return e2;
}