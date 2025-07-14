import React from 'react';
import { observer } from 'mobx-react';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';

function TreeCard({ className, tree }) {
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
    <Card
      className={className}
      raised
      sx={{
        backgroundColor: (theme) => theme.palette.input.main,
        border: (theme) => `1px solid ${theme.palette.input.light}`,
      }}
    >
      <CardHeader
        avatar={
          <Chip
            label="tree"
            color="secondary"
            sx={{
              height: '30px',
              color: (theme) => theme.palette.input.contrastText,
              backgroundColor: (theme) => theme.palette.input.main,
              border: (theme) => `1px solid ${theme.palette.input.darker}`,
            }}
          />
        }
        action={
          <Box>
            <IconButton
              aria-owns={anchorEl ? 'tree-menu' : undefined}
              aria-haspopup="true"
              onClick={handleMenuClick}
              size="large">
              <MoreVertIcon />
            </IconButton>

            <Menu id="tree-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={closeMenuAndRun(tree.openFile)}>Show tree</MenuItem>
              <MenuItem onClick={closeMenuAndRun(tree.openFolder)}>Show folder</MenuItem>
              <MenuItem onClick={closeMenuAndRun(tree.remove)}>Remove</MenuItem>
            </Menu>
          </Box>
        }
        title={ tree.name }
        subheader={ '' }
      />
      <Box>
        { tree.loading ? (
          <Box sx={{ marginLeft: '10px' }}>
            <CircularProgress variant="indeterminate" />
          </Box>
        ) : null }
      </Box>
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
