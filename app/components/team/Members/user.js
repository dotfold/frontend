import React from 'react';
import classNames from 'classnames';

import Media from "../../shared/Media";
import UserAvatar from "../../shared/UserAvatar";

class User extends React.Component {
  static displayName = "Team.Members.User";

  static propTypes = {
    user: React.PropTypes.shape({
      name: React.PropTypes.string.isRequired,
      email: React.PropTypes.string.isRequired,
      avatar: React.PropTypes.shape({
        url: React.PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  };

  static contextTypes = {
    autoCompletorSuggestion: React.PropTypes.object
  };

  render() {
    // Toggle the `dark-gray` color on the repository text if this component is
    // in an auto completor and is highlighted.
    const autoCompletorSuggestion = this.context.autoCompletorSuggestion;
    const emailTextClass = classNames({
      "dark-gray": !autoCompletorSuggestion || (autoCompletorSuggestion && !autoCompletorSuggestion.selected),
      "white": (autoCompletorSuggestion && autoCompletorSuggestion.selected)
    });

    return (
      <Media>
        <Media.Image className="icon-mr" style={{ width: 39, height: 39 }} >
          <UserAvatar user={this.props.user} className="fit" />
        </Media.Image>
        <Media.Description>
          <strong className="semi-bold block">{this.props.user.name}</strong>
          <small className={emailTextClass}>{this.props.user.email}</small>
        </Media.Description>
      </Media>
    );
  }
}

export default User;
