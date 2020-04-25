class HelloMessage2 extends Component {
    render() {
        return (
            <>
                <div>Hello {this.props.name}</div>
            </>
        );
    }
}
class HelloMessage extends Component {
    render() {
        return (
            <div>
                Hello {this.props.name}
                <HelloMessage2></HelloMessage2>
            </div>
        );
    }
}

render(<HelloMessage name="Taylor" />, document.getElementById('container'));
