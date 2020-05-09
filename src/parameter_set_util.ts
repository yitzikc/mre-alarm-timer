import { ParameterSet } from '@microsoft/mixed-reality-extension-sdk';

// Get the last of potentially multiple values of a parameter in an MRE parameter set
export function  getParameterLastValue(params: ParameterSet, name: string, dflValue: string = ''): string {
    const value = params[name];
    if (typeof(value) === 'string') {
        return value;
    } else if (Array.isArray(value)) {
        return value[value.length - 1];
    }

    return dflValue;
}
