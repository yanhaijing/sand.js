class HelloMessage extends Component {
    render() {
        return <div>Hello {this.props.name}</div>;
    }
}

render(
    <HelloMessage name="Taylor" />,
    document.getElementById('container')
);
