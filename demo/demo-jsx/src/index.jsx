class HelloMessage2 extends Component {
    render() {
        console.log(this.props.name);
        setTimeout(() => console.log(this.props.name), 1000);
        return (
            <>
                <div>Hello {this.props.name}</div>
            </>
        );
    }
}
class HelloMessage extends Component {
    render() {
        return [
            <div>
                Hello {this.props.name}
                <HelloMessage2 name={this.props.name}></HelloMessage2>
            </div>,
            <div>
                Hello {this.props.name}
                <HelloMessage2 name={this.props.name}></HelloMessage2>
            </div>,
        ];
    }
}

render(<HelloMessage name="Taylor" />, document.getElementById('container'));
