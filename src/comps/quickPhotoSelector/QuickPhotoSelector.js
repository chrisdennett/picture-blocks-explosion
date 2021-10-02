// externals
import React, { Component } from "react";
// styles
import "./quickPhotoSelector_styles.css";

class PhotoSelector extends Component {
  constructor(props) {
    super(props);

    this.onFileSelect = this.onFileSelect.bind(this);
    this.onInputClick = this.onInputClick.bind(this);
  }

  onFileSelect(e) {
    e.preventDefault();
    if (e.target.files[0]) {
      const selected = e.target.files;

      if (this.props.allowMultiple) {
        this.props.onMultiplePhotosSelected(selected);
      } else {
        this.props.onPhotoSelected(selected[0]);
      }
    }
  }

  onInputClick() {
    const { onInputClick, id } = this.props;
    if (onInputClick) {
      onInputClick(id);
    }
  }

  render() {
    const { id = "123", allowMultiple = false } = this.props;

    return (
      <div className={"quickPhotoSelector"} style={{ cursor: "pointer" }}>
        <input
          className="quickPhotoSelector--input"
          onClick={this.onInputClick}
          onChange={this.onFileSelect}
          multiple={allowMultiple}
          capture="environment"
          type="file"
          accept="image/*;capture=camera"
          name={id}
          id={id}
        />

        <label htmlFor={id} style={{ pointerEvents: "none" }}>
          {this.props.children}
        </label>
      </div>
    );
  }
}

export default PhotoSelector;
