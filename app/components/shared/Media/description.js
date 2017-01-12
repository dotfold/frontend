import React from "react";

class Description extends React.Component {
  static propTypes = {
    children: React.PropTypes.node.isRequired,
    className: React.PropTypes.string,
    style: React.PropTypes.object
  };

  render() {
    return (
      <div className={this.props.className} style={this.props.style}>
        {this.props.children}
      </div>
    );
  }
}

export default Description;
