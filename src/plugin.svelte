<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content">
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={() => bcast.emit('rqstOpen', 'menu')}
    >
        {title}
    </div>
    <p>
        In these charts, the pressure difference between

        <select bind:value={csIndex} id="CS">
            {#each crossSections as cs, index}
                <option value={index}>{cs.start} - {cs.end}</option>
            {/each}
        </select>
        is represented.

        {#each crossSections[csIndex].models as model}
            {@const cs = crossSections[csIndex]}
            <h2 class="mb-10">{cs.windName} Chart {model}</h2>
            <Chart
                pointTop={endPoints[cs.start]}
                pointBottom={endPoints[cs.end]}
                forecastModel={nwm[model]}
                nameOfThisPlugin={name}
                topText={cs.topText}
                bottomText={cs.bottomText}
            />
            <hr />
        {/each}

        {crossSections[csIndex].remark}
    </p>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import config from './pluginConfig';
    import Chart from './Chart.svelte';
    import type { LatLon } from '@windy/interfaces.d';
    import { map as windyMap } from '@windy/map';
    import windyStore from '@windy/store';
    import { onDestroy, onMount } from 'svelte';
    //Imports für Interpolation von Werten
    import { getLatLonInterpolator } from '@windy/interpolator';
    import type { CoordsInterpolationFun } from '@windy/interpolator';
    import { wind2obj } from '@windy/utils';
    import metrics from '@windy/metrics';

    /* Variables are set in src/static */
    import { crossSections, endPoints, nwm } from 'src/static';

    const { title, name } = config;

    /* Add layer for lines to the map*/
    var activeLine = L.featureGroup().addTo(windyMap);
    var midPointLoc: LatLon;
    let midPopup: L.Popup;

    let csIndex = 4; // set default cross section

    /* Determine middle position of two coords */
    // https://gis.stackexchange.com/questions/123542/leafletjs-get-latlng-center-position-of-polyline
    function midPoint(src: LatLon, dst: LatLon): LatLon {
        let srcLatRad = src.lat * (Math.PI / 180);
        let dstLatRad = dst.lat * (Math.PI / 180);
        let middleLatRad = Math.atan(
            Math.sinh(
                Math.log(
                    Math.sqrt(
                        (Math.tan(dstLatRad) + 1 / Math.cos(dstLatRad)) *
                            (Math.tan(srcLatRad) + 1 / Math.cos(srcLatRad)),
                    ),
                ),
            ),
        );
        return { lat: middleLatRad * (180 / Math.PI), lon: (src.lon + dst.lon) / 2 };
    }

    function csName(i: number): string {
        return `${crossSections[i].start} - ${crossSections[i].end}<br />`;
    }

    /* Show wind overlay at 700 hPa*/
    windyStore.set('overlay', 'wind');
    windyStore.set('level', '700h');

    /* Center map (and place picker with wind direction and speed to) at a location refering to the cross section */
    $: {
        const cs = crossSections[csIndex];
        const start: LatLon = endPoints[cs.start];
        const end: LatLon = endPoints[cs.end];
        activeLine.clearLayers();
        L.polyline(
            [
                [start.lat, start.lon],
                [end.lat, end.lon],
            ],
            { color: 'red' },
        ).addTo(activeLine);

        midPointLoc = midPoint(start, end);
        midPopup = new L.Popup({ autoClose: false, closeOnClick: false, closeButton: false })
            .setLatLng([midPointLoc.lat, midPointLoc.lon])
            .addTo(activeLine);
        setPopupInfo(midPointLoc);

        const bounds = new L.LatLngBounds([
            [Math.max(start.lat, end.lat) + 0.5, Math.max(start.lon, end.lon) + 0.5],
            [Math.min(start.lat, end.lat) - 0.5, Math.min(start.lon, end.lon) - 0.5],
        ]);

        /* Windy bug:  They have modified the fitBounds function to fit the map when the pane is open, but still use the original map width. So padding:[ half of pane width + your padding, your padding ].*/
        // Wait for popup placement to finish before fitting map
        setTimeout(() => windyMap.fitBounds(bounds, { padding: [395, 20] }), 100);
    }

    function setPopupInfo(middle: LatLon) {
        /* Interpolate wind values for the selected cross section*/
        getLatLonInterpolator().then((interpolateLatLon: CoordsInterpolationFun | null) => {
            let html = csName(csIndex);

            if (!interpolateLatLon) {
                html += '<tr green-text > Do not reload this plugin.<br /> Start it again!';
            } else if (windyStore.get('overlay') !== 'wind') {
                html +=
                    'Only wind is interpolated.<br />Please select wind overlay.';
            } else {
                // Interpolated values can be either invalid (NaN, null, -1)
                // or array of numbers
                const interpolated = interpolateLatLon(middle);

                if (Array.isArray(interpolated)) {
                    // I everything works well, we should get raw meterological values
                    const { dir, wind } = wind2obj(interpolated);

                    // This will convert wind speed form m/s to user's preferred units
                    const windSpeed = metrics.wind.convertValue(wind);

                    html += `<b> Wind: ${dir}° ${windSpeed}<br /></b>`;
                } else {
                    html += 'No interpolated values available for this position';
                }
                // const ts = new Date(windyStore.get('timestamp'));
                // html += `<b> ${ts.toLocaleDateString('en-US')} ${ts.toLocaleTimeString('en-US')}<br /></b>`;
            }
            midPopup?.setContent(html);
        });
    }

    const listener = () => {
        // console.log('---redrawFinished', new Date(windyStore.get('timestamp')));
        setPopupInfo(midPointLoc);
    };

    onMount(() => {
        console.log('--Mount');
        bcast.on('redrawFinished', listener);
    });
    onDestroy(() => {
        bcast.off('redrawFinished', listener);
        windyMap.removeLayer(activeLine);
        });
</script>

<style lang="less">
    p {
        line-height: 1.8;
    }
</style>
