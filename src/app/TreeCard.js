import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import classNames from 'classnames';
import CircularProgress from "@material-ui/core/CircularProgress";
import Chip from "@material-ui/core/Chip";
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';

const useStyles = makeStyles(theme => ({
  TreeCard: {
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    backgroundColor: '#393939',
    border: `1px solid #999`
  },
  card: {
    // width: '350px',
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
  },
  name: {
    marginRight: theme.spacing(1),
  },
  chip: {
    height: '30px',
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.secondary.main,
  },
  divider: {
    margin: '0 4px',
  },
  fileInfo: {
    color: '#ccc',
    fontSize: '0.75em',
    marginTop: '0.25em',
    overflowWrap: 'break-word',
  },
  path: {
    cursor: 'pointer',
    color: theme.palette.secondary.main,
    marginLeft: 4,
  },
  button: {
    margin: theme.spacing(1),
  },
  rightIcon: {
    marginLeft: theme.spacing(1),
  },
  iconSmall: {
    fontSize: 20,
  },
  outputButton: {
    marginLeft: theme.spacing(1),
  },
  loading: {
    marginLeft: '10px',
  },
  remove: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'flex-end',
  }

}));

function TreeCard({ className, tree }) {

  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);

  function handleMenuClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleMenuClose() {
    setAnchorEl(null);
  }

  function closeMenuAndRun(callback) {
    return () => {
      callback();
      setAnchorEl(null);
    }
  }

  return (
    <Card className={classNames(className, classes.card)} raised>
      <CardHeader
        avatar={
          <Chip className={classes.chip} label=".tree" color="secondary" />
        }
        action={
          <div>
            <IconButton
              aria-owns={anchorEl ? 'tree-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
            >
              <MoreVertIcon />
            </IconButton>

            <Menu id="tree-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={closeMenuAndRun(tree.openFile)}>Show tree</MenuItem>
              <MenuItem onClick={closeMenuAndRun(tree.openFolder)}>Show folder</MenuItem>
              <MenuItem onClick={closeMenuAndRun(tree.remove)}>Remove</MenuItem>
            </Menu>
          </div>
        }
        title={ tree.name }
        subheader={ '' }
      />
      <div>
        { tree.loading ? (
          <div className={classes.loading}>
            <CircularProgress variant="indeterminate" />
          </div>
        ) : null }
      </div>
      <CardContent>
      </CardContent>
    </Card>
  );
};
// <Box display="flex" alignItems="center" justifyContent="center">{tree.name}</Box>


TreeCard.propTypes = {
  tree: PropTypes.object.isRequired,
  className: PropTypes.string,
};

export default observer(TreeCard);
