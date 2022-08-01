import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import classNames from 'classnames';
import CircularProgress from '@material-ui/core/CircularProgress';
import Chip from '@material-ui/core/Chip';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import Box from '@material-ui/core/Box';

// const useStyles = makeStyles(theme => ({
const useStyles = makeStyles((theme) => {
  return {
    AstralTreeCard: {
      backgroundColor: theme.palette.input.light,
      border: `1px solid ${theme.palette.input.border}`,
    },
    cardHeaderRoot: {
      overflow: "hidden"
    },
    cardHeaderContent: {
      overflow: "hidden"
    },
    content: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '-10px',
    },
    chip: {
      height: '30px',
      color: theme.palette.input.contrastText,
      backgroundColor: theme.palette.input.main,
      border: `1px solid ${theme.palette.input.darker}`,
    },
  };
});

function AstralTreeCard({ className, astralTree }) {
  const { } = astralTree;

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
    };
  }

  const Content = (
    <div className={classes.content}>
      <div>
        <Box display="flex" flexWrap="wrap" alignItems="center">

        </Box>
      </div>
    </div>
  );

  return (
    <Card className={classNames(className, classes.AstralTreeCard)}>
      <CardHeader
        classes={{
          root: classes.cardHeaderRoot,
          content: classes.cardHeaderContent,
        }}
        avatar={
          <Chip
            className={classes.chip}
            label={"TODO"}
            color="secondary"
          />
        }
        action={
          <div>
            <Tooltip aria-label="remove-astralTree" title="Remove input trees">
              <IconButton onClick={astralTree.remove}>
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>

            <IconButton
              aria-owns={anchorEl ? 'astralTree-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
            >
              <MoreVertIcon />
            </IconButton>

            <Menu
              id="astralTree-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={closeMenuAndRun(astralTree.openFile)}>
                Open input trees
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(astralTree.showFileInFolder)}>
                Show in folder
              </MenuItem>
              <MenuItem onClick={closeMenuAndRun(astralTree.remove)}>
                Remove input trees
              </MenuItem>
            </Menu>
          </div>
        }
        title={astralTree.filename}
        subheader={'TODO'}
        style={{ paddingBottom: 4 }}
      />
      <CardContent>{Content}</CardContent>
      <CardActions></CardActions>
    </Card>
  );
}

AstralTreeCard.propTypes = {
  astralTree: PropTypes.object.isRequired,
  className: PropTypes.string,
};

const AstralTreeCardObserver = observer(AstralTreeCard);

export default AstralTreeCardObserver;
