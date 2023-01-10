import React, {Component} from "react";
import {ResponsivePie} from "@nivo/pie";

export default class Daily_overview_expand_fault_pie_chart extends Component {

    constructor(props) {
        super(props);
        this.state = {
            data: this.props.data,
            pie_data: []
        }

        this.setState({pie_data: this.format_data_for_pie_chart(this.state.data)})
    }

    format_data_for_pie_chart(data) {
        let return_data = []
        if (data !== undefined) {

            data.forEach(data_point => {
                const color_code = Math.random() * (350 - 200) + 200;
                return_data.push({
                    "id": data_point["fault_code"],
                    "label": data_point["fault_code"],
                    "value": data_point["count"],
                    "color": `hsl(${color_code}, 70%, 50%})`
                })
            });

            return return_data;
        } else {
            return [];
        }
    }

    UNSAFE_UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: nextProps.data})
        this.setState({pie_data: this.format_data_for_pie_chart(nextProps.data)});
    }

    render() {


        return (
            <div style={{height: 200}}>
                <ResponsivePie
                    data={this.state.pie_data}
                    margin={{top: 40, right: 200, bottom: 40, left: 80}}
                    pixelRatio={1}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    colors={{scheme: 'paired'}}
                    borderColor={{from: 'color', modifiers: [['darker', 0.6]]}}
                    radialLabelsSkipAngle={10}
                    radialLabelsTextXOffset={6}
                    radialLabelsTextColor="#333333"
                    radialLabelsLinkOffset={0}
                    radialLabelsLinkDiagonalLength={16}
                    radialLabelsLinkHorizontalLength={24}
                    radialLabelsLinkStrokeWidth={1}
                    radialLabelsLinkColor={{from: 'color'}}
                    slicesLabelsSkipAngle={10}
                    slicesLabelsTextColor="#333333"
                    animate={true}
                    motionStiffness={90}
                    motionDamping={15}
                    defs={[
                        {
                            id: 'dots',
                            type: 'patternDots',
                            background: 'inherit',
                            color: 'rgba(255, 255, 255, 0.3)',
                            size: 4,
                            padding: 1,
                            stagger: true
                        },
                        {
                            id: 'lines',
                            type: 'patternLines',
                            background: 'inherit',
                            color: 'rgba(255, 255, 255, 0.3)',
                            rotation: -45,
                            lineWidth: 6,
                            spacing: 10
                        }
                    ]}
                    // fill={[
                    //     {
                    //         match: {
                    //             id: 'ruby'
                    //         },
                    //         id: 'dots'
                    //     },
                    //     {
                    //         match: {
                    //             id: 'c'
                    //         },
                    //         id: 'dots'
                    //     },
                    //     {
                    //         match: {
                    //             id: 'go'
                    //         },
                    //         id: 'dots'
                    //     },
                    //     {
                    //         match: {
                    //             id: 'python'
                    //         },
                    //         id: 'dots'
                    //     },
                    //     {
                    //         match: {
                    //             id: 'scala'
                    //         },
                    //         id: 'lines'
                    //     },
                    //     {
                    //         match: {
                    //             id: 'lisp'
                    //         },
                    //         id: 'lines'
                    //     },
                    //     {
                    //         match: {
                    //             id: 'elixir'
                    //         },
                    //         id: 'lines'
                    //     },
                    //     {
                    //         match: {
                    //             id: 'javascript'
                    //         },
                    //         id: 'lines'
                    //     }
                    // ]}
                    legends={[
                        {
                            anchor: 'right',
                            direction: 'column',
                            translateX: 140,
                            itemWidth: 60,
                            itemHeight: 14,
                            itemsSpacing: 2,
                            symbolSize: 14,
                            symbolShape: 'circle'
                        }
                    ]}
                />
            </div>
        )
    }


}