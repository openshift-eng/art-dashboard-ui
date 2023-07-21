import React, { useEffect, useState } from 'react';
import { fetchRpmsImages } from '../api_calls/rpms_images_fetcher_calls';
import { Spin, Table, Row, Col, Input } from 'antd';

const { Search } = Input;

export default function RpmsImagesList({ branch, onLoaded }) { // Accept onLoaded as prop
  const [rpmsImagesData, setRpmsImagesData] = useState(null);
  const [searchedRpm, setSearchedRpm] = useState('');
  const [searchedImage, setSearchedImage] = useState('');

  useEffect(() => {
    fetchRpmsImages(branch)
      .then(data => {
        setRpmsImagesData(data.payload);
        onLoaded(); // Call onLoaded function after setting the data
      })
      .catch(error => console.error('Error:', error));
  }, [branch, onLoaded]); // Add onLoaded to dependency array

  if (!rpmsImagesData) {
    return <Spin />;
  }

  const rpmsData = rpmsImagesData[0].rpms_in_distgit
    .filter(rpm => rpm.includes(searchedRpm))
    .map((rpmName, index) => ({
      key: index,
      rpmName,
    }));

  const imagesData = rpmsImagesData[0].images_in_distgit
    .filter(image => image.includes(searchedImage))
    .map((imageName, index) => ({
      key: index,
      imageName,
    }));

  return (
    <Row gutter={16}>
      <Col span={24}>
        <h2>RPMs and Images the ART Team is Currently Building</h2>
      </Col>
      <Col span={12}>
        <Search
          placeholder="Search RPM"
          onChange={e => setSearchedRpm(e.target.value)}
        />
        <Table dataSource={rpmsData} columns={[{ title: 'RPM Name', dataIndex: 'rpmName', key: 'rpmName' }]} />
      </Col>
      <Col span={12}>
        <Search
          placeholder="Search Image"
          onChange={e => setSearchedImage(e.target.value)}
        />
        <Table dataSource={imagesData} columns={[{ title: 'Image Name', dataIndex: 'imageName', key: 'imageName' }]}/>
      </Col>
    </Row>
  );
}