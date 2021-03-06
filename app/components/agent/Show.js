import React from 'react';
import Relay from 'react-relay';
import DocumentTitle from 'react-document-title';
import { seconds } from 'metrick/duration';

import Button from '../shared/Button';
import FlashesStore from '../../stores/FlashesStore';
import FriendlyTime from "../shared/FriendlyTime";
import JobLink from '../shared/JobLink';
import PageWithContainer from '../shared/PageWithContainer';
import Panel from '../shared/Panel';
import permissions from '../../lib/permissions';
import { getColourForConnectionState, getLabelForConnectionState } from './shared';

import AgentStopMutation from '../../mutations/AgentStop';

class AgentShow extends React.Component {
  static propTypes = {
    agent: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      name: React.PropTypes.string.isRequired,
      connectionState: React.PropTypes.string.isRequired,
      permissions: React.PropTypes.shape({
        agentStop: React.PropTypes.shape({
          allowed: React.PropTypes.bool.isRequired
        }).isRequired
      }).isRequired
    }),
    relay: React.PropTypes.object.isRequired
  };

  state = {
    stopping: false
  };

  componentDidMount() {
    this._agentRefreshInterval = setInterval(this.fetchUpdatedData, 5::seconds);
  }

  componentWillUnmount() {
    clearInterval(this._agentRefreshInterval);
  }

  fetchUpdatedData = () => {
    this.props.relay.forceFetch(true);
  };

  renderExtraItem(title, content) {
    return (
      <li key={title}>
        <strong className="black">{title}:</strong> {content}
      </li>
    );
  }

  renderExtras(agent) {
    const extras = [];

    if (agent.version) {
      extras.push(this.renderExtraItem('Version', agent.version));
    }

    if (agent.hostname) {
      extras.push(this.renderExtraItem('Hostname', agent.hostname));
    }

    if (agent.pid) {
      extras.push(this.renderExtraItem('PID', agent.pid));
    }

    if (agent.ipAddress) {
      extras.push(this.renderExtraItem('IP Address', agent.ipAddress));
    }

    if (agent.userAgent) {
      extras.push(this.renderExtraItem('User Agent', agent.userAgent));
    }

    if (agent.operatingSystem) {
      extras.push(this.renderExtraItem('OS', agent.operatingSystem));
    }

    if (agent.priority) {
      extras.push(this.renderExtraItem('Priority', agent.priority));
    }

    if (agent.job) {
      extras.push(this.renderExtraItem('Running', <JobLink job={agent.job} />));
    }

    if (agent.connectedAt) {
      extras.push(this.renderExtraItem(
        'Connected',
        <span>
          <FriendlyTime value={agent.connectedAt} />
          {agent.pingedAt && agent.connectionState === 'connected' &&
            <span> (last check-in was <FriendlyTime value={agent.pingedAt} capitalized={false} />)</span>
          }
        </span>
      ));
    }

    if (agent.connectionState === 'disconnected') {
      extras.push(this.renderExtraItem(
        'Disconnected',
        <FriendlyTime value={agent.disconnectedAt} />
      ));
    } else if (agent.connectionState === 'lost') {
      extras.push(this.renderExtraItem(
        'Lost',
        <FriendlyTime value={agent.lostAt} />
      ));
    } else if (agent.connectionState === 'stopped' || agent.connectionState === 'stopping') {
      extras.push(this.renderExtraItem(
        'Stopped',
        <span>
          <FriendlyTime value={agent.stoppedAt} /> by {agent.stoppedBy.name}
        </span>
      ));

      // Also show when the agent eventually disconnected
      if (agent.disconnectedAt) {
        extras.push(this.renderExtraItem(
          'Disconnected',
          <FriendlyTime value={agent.disconnectedAt} />
        ));
      }
    }

    return extras;
  }

  handleStopButtonClick = (evt) => {
    evt.preventDefault();

    this.setState({ stopping: true });

    const mutation = new AgentStopMutation({
      agent: this.props.agent,
      graceful: false
    });

    Relay.Store.commitUpdate(mutation, {
      onSuccess: this.handleMutationSuccess,
      onFailure: this.handleMutationError
    });
  };

  handleMutationSuccess = () => {
    this.setState({ stopping: false });
  };

  handleMutationError = (transaction) => {
    FlashesStore.flash(FlashesStore.ERROR, transaction.getError());

    this.setState({ stopping: false });
  };

  render() {
    const agent = this.props.agent;

    const connectionStateClassName = getColourForConnectionState(agent.connectionState);

    let metaDataContent = 'None';
    if (agent.metaData && agent.metaData.length) {
      metaDataContent = agent.metaData.sort().join('\n');
    }

    return (
      <DocumentTitle title={`Agents / ${agent.name} · ${agent.organization.name}`}>
        <PageWithContainer>
          <Panel>
            <Panel.Header>{agent.name}</Panel.Header>

            <Panel.Row>
              <div className="sm-col sm-right-align sm-col-3 p2">
                Status
              </div>
              <div className="sm-col sm-col-9 p2">
                <strong className={connectionStateClassName}>
                  {getLabelForConnectionState(agent.connectionState)}
                </strong>
                <br />
                <small className="dark-gray">
                  <ul className="list-reset m0">
                    {this.renderExtras(agent)}
                  </ul>
                </small>
              </div>
            </Panel.Row>

            <Panel.Row>
              <div className="sm-col sm-right-align sm-col-3 p2">
                Meta Data
              </div>
              <div className="left sm-col-9 p2">
                <pre className="black bg-silver rounded border border-gray p1 m0 monospace">{metaDataContent}</pre>
                <small className="dark-gray">
                  You can use the agent’s meta-data to target the agent in your pipeline’s step configuration, or to set the agent’s queue.
                  See the <a className="blue hover-navy text-decoration-none hover-underline" href="/docs/agent/agent-meta-data">Agent Meta-data Documentation</a> and <a className="blue hover-navy text-decoration-none hover-underline" href="/docs/agent/queues">Agent Queues Documentation</a> for more details.
                </small>
              </div>
            </Panel.Row>

            {this.renderStopRow()}
          </Panel>
        </PageWithContainer>
      </DocumentTitle>
    );
  }

  renderStopRow() {
    if (this.props.agent.connectionState !== 'connected') {
      return null;
    }

    return permissions(this.props.agent.permissions).collect(
      {
        allowed: "agentStop",
        render: (idx) => (
          <Panel.Row key={idx}>
            <div className="sm-col sm-right-align sm-col-3 p2 xs-hide" />
            <div className="sm-col sm-col-9 p2">
              <Button
                theme="default"
                outline={true}
                loading={this.state.stopping ? "Stopping…" : false}
                onClick={this.handleStopButtonClick}
              >
                Stop Agent
              </Button>
              <br />
              <small className="dark-gray">
                Remotely stop this agent process.
                Any running build job will be canceled.
              </small>
            </div>
          </Panel.Row>
        )
      }
    );
  }
}

export default Relay.createContainer(AgentShow, {
  fragments: {
    agent: () => Relay.QL`
      fragment on Agent {
        ${AgentStopMutation.getFragment('agent')}
        connectedAt
        connectionState
        disconnectedAt
        hostname
        id
        ipAddress
        job {
          ${JobLink.getFragment('job')}
        }
        lostAt
        name
        metaData
        operatingSystem
        organization {
          name
          slug
        }
        permissions {
          agentStop {
            allowed
            code
            message
          }
        }
        pid
        pingedAt
        stoppedAt
        stoppedBy {
          name
        }
        userAgent
        uuid
        version
      }
    `
  }
});
