import { SandKeyType, SandPropsType, SandTagType } from './type';

export class SandElement {
    type: SandTagType;
    key?: SandKeyType;
    props: SandPropsType;
    constructor(
        type: SandTagType,
        key: SandKeyType | undefined,
        props: SandPropsType
    ) {
        this.type = type;
        this.key = key;
        this.props = props;
    }
}
