const React = require("react");.history {
  background-color: palegreen;
}
const RouteHandler = require("react-router").RouteHandler;

const ImHistory = require('./ImHistory');
const ImSendBox = require('./ImSendBox');
const ImSideNav = require('./ImSideNav');

require('./style.less');
module.exports = React.createClass({

  contextTypes: {
    router: React.PropTypes.func.isRequired
  },

  propTypes : {

  },

  componentDidMount() {
    this.props.setTitle("Instant Message - " + this.context.router.getCurrentParams().channelHash);

    this.style = {
      height : $(window).height() - $('.topNav').height()
    };

  },
  render() {

    return (
    <div className="instant-message-container">
      <div className="main" style={this.style}>
        <ImHistory className="history"></ImHistory>
        <ImSendBox className="send-box"></ImSendBox>
      </div>

      <ImSideNav className="sidebar"></ImSideNav>
    </div>
    );
  }
});