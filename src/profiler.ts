import { Component } from './component';
import { SandElement } from './element';

export class Profiler extends Component {
    startTime!: number;
    componentWillMount() {
        this.startTime = Date.now();
    }
    componentDidMount() {
        this.onRender('mount', this.startTime, Date.now());
    }
    componentWillUpdate() {
        this.startTime = Date.now();
    }
    componentDidUpdate() {
        this.onRender('update', this.startTime, Date.now());
    }
    onRender(phase: 'mount' | 'update', startTime: number, commitTime: number) {
        const { id, onRender } = this.props;

        if (typeof onRender === 'function') {
            onRender({
                id,
                phase,
                startTime,
                commitTime,
                actualDuration: commitTime - startTime,
            });
        }
    }
    render() {
        return this.props.children as SandElement[];
    }
}
