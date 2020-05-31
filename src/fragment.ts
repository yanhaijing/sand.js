import { Component } from './component';
import { createElement } from '.';

export class Fragment extends Component {
    render() {
        return createElement('', undefined, this.props.children);
    }
}
